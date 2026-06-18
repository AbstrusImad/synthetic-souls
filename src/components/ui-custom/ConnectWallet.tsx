'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/lib/wallet';
import { EXPLORER, FAUCET, CONTRACT_ADDRESS, shortAddr } from '@/lib/genlayer-chain';

// The usual GenLayer connect control: injected wallet (MetaMask) on Bradbury.
// A bespoke amber control, not a third-party modal, to fit the terminal.

export function ConnectWallet() {
  const { address, onChain, connecting, error, connect, disconnect, _init } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    _init();
  }, [_init]);

  const dot = address ? (onChain ? '#7d9b8e' : '#b76e4a') : 'rgba(255,255,255,0.4)';

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* ignore */ }
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
  };

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        style={{
          ...labelStyle,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'transparent',
          border: '1px solid #d4a574',
          color: '#d4a574',
          padding: '11px 22px',
          cursor: 'none',
          transition: 'all 0.4s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(212, 165, 116, 0.1)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 165, 116, 0.3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block' }} />
        {connecting ? 'connecting…' : error === 'no-wallet' ? 'install a wallet' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          ...labelStyle,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.85)',
          padding: '11px 18px',
          cursor: 'none',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.12em',
          textTransform: 'none',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block', boxShadow: `0 0 10px ${dot}` }} />
        {shortAddr(address)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: 248,
              background: 'rgba(10,10,15,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              padding: 16,
              zIndex: 100,
            }}
          >
            {!onChain && (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#b76e4a', marginBottom: 12, lineHeight: 1.5 }}>
                wrong network. reconnect to switch to Bradbury.
              </p>
            )}
            <button onClick={copy} style={menuItem}>
              {copied ? 'copied' : 'copy address'}
            </button>
            <a href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" style={menuItem as React.CSSProperties}>
              the contract
            </a>
            <a href={FAUCET} target="_blank" rel="noreferrer" style={menuItem as React.CSSProperties}>
              claim test GEN
            </a>
            <button onClick={() => { disconnect(); setOpen(false); }} style={{ ...menuItem, color: '#b76e4a' }}>
              disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const menuItem: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,0.8)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  letterSpacing: '0.08em',
  padding: '8px 0',
  cursor: 'none',
  textDecoration: 'none',
};
