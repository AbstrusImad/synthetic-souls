'use client';

// Wallet connection for GenLayer Bradbury, the usual method: the injected
// provider (MetaMask). We add/switch to Bradbury and expose the connected
// account through a small Zustand store shared by the Connect button and the
// transaction code in lib/genlayer.

import { create } from 'zustand';

export const BRADBURY = {
  chainIdHex: '0x107D', // 4221
  chainId: 4221,
  params: {
    chainId: '0x107D',
    chainName: 'GenLayer Bradbury Testnet',
    nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
    rpcUrls: ['https://rpc-bradbury.genlayer.com'],
    blockExplorerUrls: ['https://explorer-bradbury.genlayer.com/'],
  },
} as const;

type Eth = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function getEthereum(): Eth | null {
  if (typeof window === 'undefined') return null;
  const e = (window as unknown as { ethereum?: Eth }).ethereum;
  return e ?? null;
}

interface WalletState {
  address: `0x${string}` | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  onChain: boolean; // true when on Bradbury
  connect: () => Promise<void>;
  disconnect: () => void;
  _init: () => void;
}

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  chainId: null,
  connecting: false,
  error: null,
  onChain: false,

  connect: async () => {
    const eth = getEthereum();
    if (!eth) {
      set({ error: 'no-wallet' });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    set({ connecting: true, error: null });
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const addr = (accounts && accounts[0]) as `0x${string}` | undefined;
      if (!addr) throw new Error('No account');

      // Add then switch to Bradbury (idempotent).
      try {
        await eth.request({ method: 'wallet_addEthereumChain', params: [BRADBURY.params] });
      } catch { /* already added */ }
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BRADBURY.chainIdHex }] });
      } catch { /* user may decline; still connected */ }

      let chainId: number | null = null;
      try {
        const cid = (await eth.request({ method: 'eth_chainId' })) as string;
        chainId = parseInt(cid, 16);
      } catch { /* ignore */ }

      set({ address: addr, chainId, onChain: chainId === BRADBURY.chainId, connecting: false, error: null });
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      set({ connecting: false, error: /reject|denied|4001/i.test(msg) ? 'rejected' : msg });
    }
  },

  disconnect: () => set({ address: null, chainId: null, onChain: false, error: null }),

  _init: () => {
    const eth = getEthereum();
    if (!eth || !eth.on) return;
    eth.on('accountsChanged', (...a: unknown[]) => {
      const accs = a[0] as string[];
      if (!accs || accs.length === 0) get().disconnect();
      else set({ address: accs[0] as `0x${string}` });
    });
    eth.on('chainChanged', (...a: unknown[]) => {
      const cid = parseInt(String(a[0]), 16);
      set({ chainId: cid, onChain: cid === BRADBURY.chainId });
    });
  },
}));
