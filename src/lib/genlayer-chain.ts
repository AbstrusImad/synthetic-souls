// Real GenLayer plumbing for Synthetic Souls on the Bradbury testnet.
// Read client (no wallet), wallet client (signs through the injected provider),
// resilient reads, transaction polling that survives leader rotations, a leader
// peek for live previews, and mappers from the on-chain record to the UI Soul.

import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import type { Soul, Message, PersonalityDimension, ValidatorModel } from '@/types/soul';

export const CONTRACT_ADDRESS = '0xf2921aDbF551969446976ba088E5CD2e71382498';
export const DEPLOY_TX = '0x4a5bf0d6e3d6ea10785c357e3af7b2e283e3428e761315c75faaf28a82ee3492';
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';

const ADDRESS = CONTRACT_ADDRESS as `0x${string}`;

export const readClient = createClient({ chain: testnetBradbury });

export function makeWalletClient(account: `0x${string}`) {
  const provider = typeof window !== 'undefined' ? (window as unknown as { ethereum?: unknown }).ethereum : undefined;
  return createClient({ chain: testnetBradbury, account, provider } as Parameters<typeof createClient>[0]);
}
export type WalletClient = ReturnType<typeof makeWalletClient>;

// ---- resilient reads -----------------------------------------------------

export async function withRpcRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|too many|not found|not be found/i.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i));
    }
  }
  throw last;
}

function normalize(value: unknown): unknown {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = normalize(v);
    return obj;
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'bigint') return Number(value);
  return value;
}

function num(v: unknown, d = 0): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(String(v ?? ''));
  return Number.isFinite(n) ? n : d;
}
function str(v: unknown): string {
  return String(v ?? '');
}

const FALLBACK_VALIDATORS: ValidatorModel[] = ['GPT-4', 'Claude', 'Llama', 'Gemini', 'Mistral'];

export function mapSoul(raw: unknown): Soul {
  const r = normalize(raw) as Record<string, unknown>;
  const influences = Array.isArray(r.influences) ? (r.influences as unknown[]).map(str) : [];
  const personality: PersonalityDimension[] = Array.isArray(r.personality)
    ? (r.personality as unknown[]).map((d) => {
        const o = d as Record<string, unknown>;
        return { name: str(o.name), value: num(o.value, 50) };
      })
    : [];
  const validators = Array.isArray(r.validators) && r.validators.length
    ? (r.validators as unknown[]).map(str)
    : FALLBACK_VALIDATORS;
  const created = num(r.createdAt, 0);
  return {
    id: str(r.id),
    name: str(r.name),
    tagline: str(r.tagline),
    description: str(r.description),
    influences,
    personality,
    createdAt: created > 0 ? created : Date.now(),
    conversations: num(r.conversations, 0),
    birthHash: str(r.birthHash),
    validators: validators as ValidatorModel[],
  };
}

// ---- reads ---------------------------------------------------------------

export async function fetchSouls(): Promise<Soul[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_souls', args: [0] }),
  );
  const arr = (normalize(raw) as unknown[]) ?? [];
  return (Array.isArray(arr) ? arr : []).map(mapSoul);
}

export async function fetchSoul(id: string): Promise<Soul | null> {
  try {
    const raw = await withRpcRetry(() =>
      readClient.readContract({ address: ADDRESS, functionName: 'get_soul', args: [id] }),
    );
    return mapSoul(raw);
  } catch {
    return null;
  }
}

export async function fetchMessages(soulId: string): Promise<Message[]> {
  try {
    const raw = await withRpcRetry(() =>
      readClient.readContract({ address: ADDRESS, functionName: 'get_messages', args: [soulId, 0] }),
    );
    const arr = (normalize(raw) as unknown[]) ?? [];
    return (Array.isArray(arr) ? arr : []).map((t, i) => {
      const o = t as Record<string, unknown>;
      const role = str(o.role) === 'soul' ? 'soul' : 'user';
      return {
        id: `m-${i}`,
        role,
        content: str(o.content),
        timestamp: Date.now(),
        consensus: role === 'soul' ? 'converged' : undefined,
      } as Message;
    });
  } catch {
    return [];
  }
}

// ---- writes --------------------------------------------------------------

export function writeCreateSoul(
  client: WalletClient,
  name: string,
  description: string,
  influences: string[],
  personality: PersonalityDimension[],
) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'create_soul',
    args: [name, description, JSON.stringify(influences), JSON.stringify(personality)],
    value: 0n,
  });
}

export function writeTalkToSoul(client: WalletClient, soulId: string, message: string) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'talk_to_soul',
    args: [soulId, message],
    value: 0n,
  });
}

// ---- transaction polling -------------------------------------------------

const STATUS_NAME: Record<string, string> = {
  '1': 'PENDING', '2': 'PROPOSING', '3': 'COMMITTING', '4': 'REVEALING',
  '5': 'ACCEPTED', '6': 'UNDETERMINED', '7': 'FINALIZED', '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT', '13': 'LEADER_TIMEOUT',
};
export const statusName = (s: unknown): string => STATUS_NAME[String(s)] ?? String(s ?? 'PENDING').toUpperCase();
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export interface LeaderDraft { reply?: string; resonance?: number; coherence?: number; tagline?: string }

function pick(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
  return undefined;
}

export function extractLeaderDraft(tx: unknown): LeaderDraft | null {
  try {
    const receipts = pick(pick(tx, 'consensus_data'), 'leader_receipt');
    const first = Array.isArray(receipts) ? receipts[0] : receipts;
    const b64 = pick(pick(first, 'eq_outputs'), '0');
    if (typeof b64 !== 'string' || b64.length === 0) return null;
    const text = atob(b64);
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] !== '{') continue;
      try {
        const obj = JSON.parse(text.slice(i)) as Record<string, unknown>;
        if (obj && typeof obj === 'object' && ('reply' in obj || 'coherence' in obj || 'resonance' in obj)) {
          return obj as LeaderDraft;
        }
      } catch { /* keep scanning */ }
    }
    return null;
  } catch {
    return null;
  }
}

export interface PollResult { status: string; draft: LeaderDraft | null }

export async function pollUntilDecided(
  client: WalletClient,
  hash: `0x${string}`,
  onUpdate?: (status: string, draft: LeaderDraft | null) => void,
): Promise<PollResult> {
  let draft: LeaderDraft | null = null;
  for (let i = 0; i < 160; i++) {
    const tx = await client
      .getTransaction({ hash } as Parameters<typeof client.getTransaction>[0])
      .catch(() => null);
    const status = statusName(tx ? (tx as { status?: unknown }).status : 'PENDING');
    draft = extractLeaderDraft(tx) ?? draft;
    onUpdate?.(status, draft);
    if (TERMINAL.has(status)) return { status, draft };
    await new Promise((r) => setTimeout(r, 8000));
  }
  return { status: 'TIMEOUT', draft };
}

export function shortAddr(a: string): string {
  return a && a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}
