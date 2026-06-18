'use client';

import { motion } from 'framer-motion';
import type { Soul } from '@/types/soul';
import { PersonalityRadar } from '@/components/mirror/PersonalityRadar';

export function MirrorView({ soul, onTalk, onExit }: {
  soul: Soul;
  onTalk: () => void;
  onExit: () => void;
}) {
  const age = Math.floor((Date.now() - soul.createdAt) / (1000 * 60 * 60 * 24));

  // Top 3 personality traits for quick read
  const topTraits = [...soul.personality]
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: 1100,
        margin: '0 auto',
        padding: '80px 32px 80px',
        minHeight: '100vh',
      }}
    >
      {/* Back link — bigger and brighter */}
      <button
        onClick={onExit}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: 14,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          cursor: 'none',
          padding: 0,
          marginBottom: 48,
          transition: 'color 0.6s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#d4a574')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
      >
        ← return to the limbo
      </button>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'start',
          marginBottom: 100,
        }}
      >
        {/* LEFT: Identity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <p style={{
            fontSize: 13,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 16,
            fontWeight: 500,
          }}>
            the mirror
          </p>
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 64,
              color: '#d4a574',
              marginBottom: 16,
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            {soul.name}
          </h1>
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: 22,
              color: 'rgba(255, 255, 255, 0.85)',
              marginBottom: 36,
              lineHeight: 1.4,
            }}
          >
            {soul.tagline}
          </p>

          {/* Description */}
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 18,
              color: '#ffffff',
              lineHeight: 1.7,
              marginBottom: 36,
              opacity: 0.9,
            }}
          >
            {soul.description}
          </p>

          {/* Top traits */}
          <div style={{ marginBottom: 36 }}>
            <p style={{
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 14,
              fontWeight: 500,
            }}>
              dominant traits
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {topTraits.map(t => (
                <span
                  key={t.name}
                  style={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '6px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                  }}
                >
                  {t.name} · {t.value}
                </span>
              ))}
            </div>
          </div>

          {/* Influences */}
          <div>
            <p style={{
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 14,
              fontWeight: 500,
            }}>
              influences
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {soul.influences.map(inf => (
                <span
                  key={inf}
                  style={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    padding: '6px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {inf}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Radar + Birth Certificate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          {/* Radar */}
          <div style={{ marginBottom: 48 }}>
            <p style={{
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 16,
              textAlign: 'center',
              fontWeight: 500,
            }}>
              personality · dna
            </p>
            <div style={{ width: 320, margin: '0 auto' }}>
              <PersonalityRadar soul={soul} size={320} />
            </div>
          </div>

          {/* Birth Certificate */}
          <div
            style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: 24,
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <p style={{
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 18,
              fontWeight: 500,
            }}>
              birth certificate
            </p>
            {[
              ['hash', soul.birthHash],
              ['validators', '5/5 converged'],
              ['age', `${age} days`],
              ['conversations', String(soul.conversations)],
              ['protocol', 'optimistic democracy'],
              ['chain', 'genlayer · zkSync'],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{k}</span>
                <span style={{ color: k === 'hash' ? '#d4a574' : '#ffffff' }}>{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          paddingBottom: 40,
        }}
      >
        <button
          onClick={onTalk}
          style={{
            background: 'transparent',
            border: '1px solid #d4a574',
            color: '#d4a574',
            padding: '14px 32px',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: 'none',
            transition: 'all 0.4s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(212, 165, 116, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 24px rgba(212, 165, 116, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          speak to {soul.name.split(' ')[0].toLowerCase()}
        </button>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#b76e4a',
            fontSize: 12,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: 'none',
            opacity: 0.85,
            transition: 'opacity 0.6s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
        >
          liberate this soul
        </button>
      </motion.div>
    </div>
  );
}
