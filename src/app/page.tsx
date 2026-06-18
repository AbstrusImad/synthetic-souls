'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Soul, AppScreen } from '@/types/soul';
import { genlayer } from '@/lib/genlayer';
import { CustomCursor } from '@/components/ui-custom/CustomCursor';
import { ParticleBackground } from '@/components/ui-custom/ParticleBackground';
import { ConnectWallet } from '@/components/ui-custom/ConnectWallet';
import { SoulOrbs } from '@/components/three/SoulOrbs';
import { RitualFlow } from '@/components/consensus/RitualFlow';
import { ConversationView } from '@/components/conversation/ConversationView';
import { MirrorView } from '@/components/mirror/MirrorView';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('limbo');
  const [souls, setSouls] = useState<Soul[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSoul, setHoveredSoul] = useState<string | null>(null);
  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emptyStateText, setEmptyStateText] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const emptyTexts = [
    'The void waits.',
    'There are no souls here yet.',
    'A fiction needs witnesses to exist.',
    'Speak a name, and the consensus may agree.',
  ];

  useEffect(() => {
    const i = setInterval(() => {
      setEmptyStateText(prev => (prev + 1) % emptyTexts.length);
    }, 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    genlayer.listSouls().then(s => {
      setSouls(s);
      setLoading(false);
    });
  }, []);

  const handleSelectSoul = async (id: string) => {
    const soul = await genlayer.getSoul(id);
    if (soul) {
      setSelectedSoul(soul);
      setScreen('mirror');
    }
  };

  const handleBirthComplete = (soul: Soul) => {
    setSouls(prev => [...prev, soul]);
    setSelectedSoul(soul);
    setScreen('session');
  };

  // ============ LIMBO ============
  if (screen === 'limbo') {
    return (
      <main
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: '#000000',
        }}
      >
        <CustomCursor />

        {/* Connect Wallet (top-right) */}
        <div style={{ position: 'absolute', top: 28, right: 32, zIndex: 20 }}>
          <ConnectWallet />
        </div>

        {/* Layer 2: 3D scene (z-2) — pure black background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}>
          {!loading && souls.length > 0 && (
            <SoulOrbs
              souls={souls}
              onSelectSoul={handleSelectSoul}
              hovered={hoveredSoul}
              setHovered={setHoveredSoul}
            />
          )}
        </div>

        {/* Layer 3: UI overlays (z-10+) */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          style={{ position: 'absolute', top: 32, left: 32, zIndex: 10 }}
        >
          <h1 style={{
            fontSize: 22,
            fontWeight: 200,
            letterSpacing: '0.15em',
            color: '#ffffff',
            lineHeight: 1.1,
          }}>
            SYNTHETIC
            <br />
            <span style={{ color: '#d4a574' }}>SOULS</span>
          </h1>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 2 }}
          style={{ position: 'absolute', top: 84, right: 32, zIndex: 10, maxWidth: 320, textAlign: 'right' }}
        >
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.5,
          }}>
            consensus ghosts ·
            <br />
            fictions made real by
            <br />
            decentralized agreement
          </p>
        </motion.div>

        {/* Center status text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 2 }}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 3 }}
        >
          {souls.length === 0 ? (
            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.8)',
            }} className="breathe">
              {emptyTexts[emptyStateText]}
            </p>
          ) : (
            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              {souls.length} {souls.length === 1 ? 'soul exists' : 'souls exist'} in the limbo
            </p>
          )}
        </motion.div>

        {/* Hovered soul tooltip — follows cursor */}
        <AnimatePresence>
          {hoveredSoul && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: cursorPos.x + 24,
                top: cursorPos.y - 12,
                pointerEvents: 'none',
                zIndex: 9999,
                maxWidth: 320,
              }}
            >
              {(() => {
                const s = souls.find(x => x.id === hoveredSoul);
                if (!s) return null;
                return (
                  <div>
                    <p
                      className="font-serif-editorial"
                      style={{
                        fontSize: 22,
                        color: '#ffffff',
                        lineHeight: 1.1,
                        marginBottom: 4,
                        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {s.name}
                    </p>
                    <p
                      className="font-serif-editorial"
                      style={{
                        fontStyle: 'italic',
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.4,
                        maxWidth: 280,
                      }}
                    >
                      {s.tagline}
                    </p>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar — fixed height, no overlap */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            zIndex: 10,
          }}
        >
          {/* Search (left) */}
          <div
            onMouseEnter={() => setSearchVisible(true)}
            onMouseLeave={() => setSearchVisible(false)}
            style={{ position: 'relative', minWidth: 200 }}
          >
            {searchVisible ? (
              <motion.input
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="search for a soul..."
                autoFocus
                style={{
                  width: 288,
                  background: 'transparent',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 16,
                  color: '#ffffff',
                  outline: 'none',
                  padding: '8px 0',
                }}
              />
            ) : (
              <p style={{
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'rgba(255, 255, 255, 0.6)',
                letterSpacing: '0.2em',
              }}>
                ⌕ search
              </p>
            )}
          </div>

          {/* Footer center hint */}
          <p style={{
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.2em',
          }}>
            drag to orbit · click an orb to enter
          </p>

          {/* Birth button (right) */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1.5 }}
            onClick={() => setScreen('ritual')}
            style={{
              background: 'transparent',
              border: '1px solid #d4a574',
              color: '#d4a574',
              padding: '12px 24px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
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
            + birth a soul
          </motion.button>
        </div>

        {/* Soul index — sidebar list for easier navigation */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            zIndex: 9,
            maxWidth: 200,
            padding: '16px 24px 16px 16px',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
          className="hide-scrollbar"
        >
          <p
            style={{
              fontSize: 9,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 12,
              textAlign: 'right',
            }}
          >
            index
          </p>
          {souls.slice(0, 8).map(s => (
            <button
              key={s.id}
              onClick={() => handleSelectSoul(s.id)}
              onMouseEnter={() => setHoveredSoul(s.id)}
              onMouseLeave={() => setHoveredSoul(null)}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: hoveredSoul === s.id ? '#d4a574' : 'rgba(255, 255, 255, 0.75)',
                fontSize: 12,
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                padding: '5px 0',
                cursor: 'none',
                textAlign: 'right',
                transition: 'color 0.3s ease',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </main>
    );
  }

  // ============ RITUAL ============
  if (screen === 'ritual') {
    return (
      <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--void)' }}>
        <CustomCursor />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          <ParticleBackground />
        </div>
        <RitualFlow
          onComplete={handleBirthComplete}
          onCancel={() => setScreen('limbo')}
        />
      </main>
    );
  }

  // ============ SESSION ============
  if (screen === 'session' && selectedSoul) {
    return (
      <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--void)' }}>
        <CustomCursor />
        <ConversationView
          soul={selectedSoul}
          onExit={() => setScreen('limbo')}
        />
      </main>
    );
  }

  // ============ MIRROR ============
  if (screen === 'mirror' && selectedSoul) {
    return (
      <main style={{ position: 'relative', width: '100vw', minHeight: '100vh', overflowY: 'auto', background: 'var(--void)' }}>
        <CustomCursor />
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'none' }}>
          <ParticleBackground />
        </div>
        <MirrorView
          soul={selectedSoul}
          onTalk={() => setScreen('session')}
          onExit={() => setScreen('limbo')}
        />
      </main>
    );
  }

  return null;
}
