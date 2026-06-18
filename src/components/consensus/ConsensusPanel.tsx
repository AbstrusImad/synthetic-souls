'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Validator, ConsensusState } from '@/types/soul';

const VALIDATOR_LABELS: Record<string, string> = {
  'GPT-4': 'GPT-4',
  'Claude': 'Claude',
  'Llama': 'Llama',
  'Gemini': 'Gemini',
  'Mistral': 'Mistral',
};

export function ConsensusPanel({
  validators,
  state,
  gasCost,
}: {
  validators: Validator[];
  state: ConsensusState;
  gasCost: number;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== 'thinking') {
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 50);
    return () => {
      clearInterval(interval);
      setElapsed(0);
    };
  }, [state]);

  const stateLabel = {
    idle: '—',
    thinking: 'consensus forming',
    converged: 'consensus reached',
    diverged: 'consensus diverged',
  }[state];

  const stateColor = {
    idle: 'rgba(255, 255, 255, 0.6)',
    thinking: '#d4a574',
    converged: '#7d9b8e',
    diverged: '#b76e4a',
  }[state];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '40px 36px',
    }}>
      {/* Header */}
      <div>
        <div style={{
          fontSize: 12,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: 10,
          fontWeight: 500,
        }}>
          Consensus Layer
        </div>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 28,
          color: stateColor,
          transition: 'color 0.8s ease',
          fontStyle: 'italic',
        }}>
          {stateLabel}
        </div>
        {state === 'thinking' && (
          <div style={{
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: 10,
          }}>
            {(elapsed / 1000).toFixed(1)}s · {gasCost.toFixed(4)} GEN
          </div>
        )}
      </div>

      {/* Validators */}
      <div style={{ margin: '32px 0' }}>
        {validators.length === 0 ? (
          <div style={{ opacity: 0.4 }}>
            {['01', '02', '03', '04', '05'].map(n => (
              <div key={n} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 0',
                opacity: 0.5,
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.3)',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 12,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    Validator {n}
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginTop: 2,
                  }}>
                    —
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          validators.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 0',
              }}
            >
              <div className={`validator-dot ${v.status}`} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.85)',
                }}>
                  Validator {String(v.id + 1).padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: 2,
                }}>
                  {VALIDATOR_LABELS[v.model]}
                </div>
              </div>
              <AnimatePresence>
                {v.status === 'answered' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: 16,
                      color: '#7d9b8e',
                    }}
                  >
                    ·
                  </motion.div>
                )}
                {v.status === 'disagreed' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontSize: 16,
                      color: '#b76e4a',
                    }}
                  >
                    ×
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        fontSize: 13,
        fontFamily: 'JetBrains Mono, monospace',
        color: 'rgba(255, 255, 255, 0.65)',
        lineHeight: 1.7,
      }}>
        <div>Optimistic Democracy</div>
        <div>5 validators · dPoS · VRF selected</div>
        <div style={{ opacity: 0.6, marginTop: 8, fontSize: 12 }}>
          Inspired by Condorcet&apos;s Jury Theorem
        </div>
      </div>
    </div>
  );
}
