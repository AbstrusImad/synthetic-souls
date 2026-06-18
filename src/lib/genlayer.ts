// GenLayer facade for Synthetic Souls.
//
// Same interface the UI already calls (listSouls, getSoul, createSoul,
// streamConsensus, streamBirthConsensus), now backed by the REAL GenLayer
// Bradbury contract: reads come from the chain, and create/talk are real
// consensus writes signed by the connected wallet. The validator animation is
// driven from the live transaction lifecycle. Mock seed souls remain only as a
// fallback when the chain is unreachable, so the limbo is never empty.

import type { Soul, Validator, ValidatorModel, ConsensusState } from '@/types/soul';
import { useWallet } from '@/lib/wallet';
import {
  CONTRACT_ADDRESS,
  fetchSouls,
  fetchSoul,
  fetchMessages,
  makeWalletClient,
  writeCreateSoul,
  writeTalkToSoul,
  pollUntilDecided,
  type LeaderDraft,
} from '@/lib/genlayer-chain';

const VALIDATOR_MODELS: ValidatorModel[] = ['GPT-4', 'Claude', 'Llama', 'Gemini', 'Mistral'];

export const CONTRACT = CONTRACT_ADDRESS;
export { fetchMessages as getMessages };

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- mock seed souls (fallback only) -------------------------------------

const SEED_SOULS: Soul[] = [
  {
    id: 'soul-seed-1', name: 'Kaspar Voss',
    tagline: 'A cartographer who refused to map the sea',
    description: 'An aging cartographer from the 1890s who believed mapping the ocean would rob it of mystery.',
    influences: ['Heraclitus', 'Romanticism', 'Solitude'],
    personality: [
      { name: 'Humor', value: 22 }, { name: 'Darkness', value: 58 }, { name: 'Verbosity', value: 71 },
      { name: 'Rationality', value: 82 }, { name: 'Mysticism', value: 67 }, { name: 'Patience', value: 91 },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14, conversations: 47,
    birthHash: '0x7a3f00e9b2c14d05', validators: VALIDATOR_MODELS,
  },
];

// ---- live detection ------------------------------------------------------

const isDeployed = /^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS);

function walletAddress(): `0x${string}` | null {
  try {
    return useWallet.getState().address;
  } catch {
    return null;
  }
}

// ---- validator animation helpers -----------------------------------------

function makeValidators(answered: number, diverged = false): Validator[] {
  return VALIDATOR_MODELS.map((model, i) => ({
    id: i,
    model,
    status: diverged && i === VALIDATOR_MODELS.length - 1
      ? 'disagreed'
      : i < answered
      ? 'answered'
      : 'thinking',
  }));
}

// Map a live tx status to how many of the five validators have "answered".
function answeredFor(status: string, ramp: number): number {
  switch (status) {
    case 'PENDING':
    case 'PROPOSING':
      return Math.min(2, ramp);
    case 'COMMITTING':
      return 3;
    case 'REVEALING':
      return 4;
    case 'ACCEPTED':
    case 'FINALIZED':
      return 5;
    default:
      return Math.min(2, ramp);
  }
}

// ---- public API ----------------------------------------------------------

export const genlayer = {
  async listSouls(): Promise<Soul[]> {
    if (!isDeployed) {
      await delay(200);
      return [...SEED_SOULS];
    }
    try {
      const souls = await fetchSouls();
      if (souls.length > 0) return souls;
      return [...SEED_SOULS];
    } catch {
      return [...SEED_SOULS];
    }
  },

  async getSoul(id: string): Promise<Soul | null> {
    if (isDeployed) {
      const s = await fetchSoul(id);
      if (s) return s;
    }
    return SEED_SOULS.find((s) => s.id === id) ?? null;
  },

  // The Ritual. A real consensus write that births the soul on chain. The
  // validator animation is driven from the live transaction lifecycle. Throws
  // when the wallet is missing, the user cancels, or the validators do not
  // agree the soul into being (the ritual then shows "could not exist").
  async createSoul(
    data: {
      name: string;
      description: string;
      influences: string[];
      personality: { name: string; value: number }[];
    },
    onUpdate?: (validators: Validator[], state: ConsensusState) => void,
  ): Promise<Soul> {
    const account = walletAddress();
    if (!account) {
      throw new Error('WALLET_REQUIRED');
    }

    onUpdate?.(makeValidators(0), 'thinking');
    const client = makeWalletClient(account);
    const hash = await writeCreateSoul(
      client,
      data.name,
      data.description,
      data.influences,
      data.personality,
    );

    let ramp = 0;
    const { status } = await pollUntilDecided(client, hash, (st) => {
      ramp = Math.min(2, ramp + 1);
      onUpdate?.(makeValidators(answeredFor(st, ramp)), 'thinking');
    });

    if (status !== 'ACCEPTED' && status !== 'FINALIZED') {
      onUpdate?.(makeValidators(4, true), 'diverged');
      throw new Error('CONSENSUS_FAILED');
    }

    onUpdate?.(makeValidators(5), 'converged');

    // Read the soul that was just born. The contract assigns sequential ids, so
    // after acceptance the newest id is soul-{count}. Match by name as a guard.
    let soul: Soul | null = null;
    try {
      const souls = await fetchSouls();
      const mine = souls.filter((s) => s.name === data.name.trim());
      soul = mine.length ? mine[mine.length - 1] : souls[souls.length - 1] ?? null;
    } catch {
      /* fall through */
    }
    if (!soul) {
      // The write was accepted but the read is lagging; synthesize from input so
      // the ritual can still complete. The next limbo load will reconcile.
      soul = {
        id: `soul-pending`,
        name: data.name.trim(),
        tagline: data.description.split('.')[0].slice(0, 80),
        description: data.description.trim(),
        influences: data.influences,
        personality: data.personality,
        createdAt: Date.now(),
        conversations: 0,
        birthHash: hash.slice(0, 18),
        validators: VALIDATOR_MODELS,
      };
    }
    return soul;
  },

  // The Session. A real consensus write: the soul replies in character and the
  // exchange is settled on chain. Drives the validator panel from the live tx,
  // then hands the converged reply back to the streaming UI.
  async streamConsensus(
    soul: Soul,
    userMessage: string,
    onUpdate: (validators: Validator[], state: ConsensusState, finalResponse: string | null, fragments?: string[]) => void,
  ): Promise<void> {
    const account = walletAddress();
    if (!account) {
      onUpdate(
        makeValidators(5),
        'converged',
        'I cannot speak until a wallet holds the seal. Connect on Bradbury, and I will answer.',
      );
      return;
    }

    onUpdate(makeValidators(0), 'thinking', null);
    try {
      const client = makeWalletClient(account);
      const hash = await writeTalkToSoul(client, soul.id, userMessage);

      let ramp = 0;
      let lastDraft: LeaderDraft | null = null;
      const { status, draft } = await pollUntilDecided(client, hash, (st, d) => {
        ramp = Math.min(2, ramp + 1);
        if (d) lastDraft = d;
        onUpdate(makeValidators(answeredFor(st, ramp)), 'thinking', null);
      });
      lastDraft = draft ?? lastDraft;

      if (status !== 'ACCEPTED' && status !== 'FINALIZED') {
        onUpdate(
          makeValidators(5),
          'converged',
          'The validators could not converge on my voice just now. Ask me again, and the consensus may hold.',
        );
        return;
      }

      // Authoritative reply: read the last soul turn from chain; fall back to the
      // leader peek if the read lags.
      let reply = '';
      try {
        const msgs = await fetchMessages(soul.id);
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'soul') {
            reply = msgs[i].content;
            break;
          }
        }
      } catch { /* ignore */ }
      if (!reply && lastDraft && typeof lastDraft.reply === 'string') reply = lastDraft.reply;
      if (!reply) reply = 'I am here, though the words arrive slowly through the consensus.';

      onUpdate(makeValidators(5), 'converged', reply);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      const friendly = /reject|denied|4001/i.test(msg)
        ? 'You drew back from the signature. I remain unspoken.'
        : /LackOfFundForMaxFee|insufficient|fee/i.test(msg)
        ? 'Your wallet is below the fee reserve for consensus. Claim test GEN and try again.'
        : 'Something interrupted the consensus. Ask me again.';
      onUpdate(makeValidators(5), 'converged', friendly);
    }
  },

  // Kept for interface compatibility. The real birth consensus is driven inside
  // createSoul from the live transaction, so this is now a no-op.
  async streamBirthConsensus(
    _soulData: { name: string; description: string },
    _onUpdate: (validators: Validator[], state: ConsensusState) => void,
  ): Promise<void> {
    return;
  },
};
