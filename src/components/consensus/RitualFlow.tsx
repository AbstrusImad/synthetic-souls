'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { genlayer } from '@/lib/genlayer';
import type { Soul, Validator, ConsensusState } from '@/types/soul';
import { ValidatorDot } from '@/components/consensus/ValidatorDot';
import { ConnectWallet } from '@/components/ui-custom/ConnectWallet';

const INFLUENCES = [
  'Heraclitus', 'Stoicism', 'Cyberpunk', 'Romanticism', 'Solitude',
  'Decay aesthetics', 'Mysticism', 'Phenomenology', 'Pastoral', 'Yokai tradition',
  'Freud', 'Lacan', 'Wittgenstein', 'Basho', 'Stanislaw Lem', 'Desert Fathers',
  'Thoreau', 'Innocence', 'Glitch aesthetics', 'Pre-industrial craft', 'Kafka',
  'Japanese folklore', 'Vienna 1900', 'Mycology', 'Christian Mysticism',
];

const DIMENSIONS = [
  'Humor', 'Darkness', 'Verbosity', 'Warmth', 'Rationality', 'Mysticism',
  'Nostalgia', 'Defiance', 'Curiosity', 'Patience', 'Irony', 'Sensuality',
];

type Step = 'name' | 'description' | 'influences' | 'personality' | 'confirm' | 'birthing' | 'born' | 'failed';

export function RitualFlow({ onComplete, onCancel }: {
  onComplete: (soul: Soul) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedInfluences, setSelectedInfluences] = useState<string[]>([]);
  const [personality, setPersonality] = useState<Record<string, number>>(
    Object.fromEntries(DIMENSIONS.map(d => [d, 50]))
  );
  const [validators, setValidators] = useState<Validator[]>([]);
  const [consensusState, setConsensusState] = useState<ConsensusState>('idle');
  const [createdSoul, setCreatedSoul] = useState<Soul | null>(null);
  const [failReason, setFailReason] = useState<'wallet' | 'consensus'>('consensus');

  const toggleInfluence = (inf: string) => {
    setSelectedInfluences(prev =>
      prev.includes(inf) ? prev.filter(i => i !== inf) : prev.length < 5 ? [...prev, inf] : prev
    );
  };

  const startBirth = async () => {
    setStep('birthing');
    setConsensusState('idle');
    setValidators([]);

    try {
      // The real Bradbury consensus write. The validator animation is driven
      // from the live transaction lifecycle inside createSoul.
      const soul = await genlayer.createSoul(
        {
          name,
          description,
          influences: selectedInfluences,
          personality: DIMENSIONS.map(d => ({ name: d, value: personality[d] })),
        },
        (v, state) => {
          setValidators(v);
          setConsensusState(state);
        }
      );

      setCreatedSoul(soul);
      setStep('born');
    } catch (e) {
      const msg = String((e as { message?: string })?.message ?? e);
      setFailReason(msg === 'WALLET_REQUIRED' ? 'wallet' : 'consensus');
      setStep('failed');
    }
  };

  const stepIndex = ['name', 'description', 'influences', 'personality', 'confirm'].indexOf(step);
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / 5) * 100 : 100;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        background: 'var(--void)',
      }}
    >
      {/* Progress bar */}
      {step !== 'birthing' && step !== 'born' && step !== 'failed' && (
        <div className="absolute top-0 left-0 right-0 h-px bg-[var(--border-faint)]">
          <motion.div
            className="h-full bg-[var(--amber)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Exit */}
      {step !== 'birthing' && step !== 'born' && (
        <button
          onClick={onCancel}
          className="absolute top-8 right-8 text-sm uppercase tracking-[0.3em] text-white/80 hover:text-[#d4a574] transition-colors duration-600"
        >
          abandon ritual
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: NAME */}
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px"}}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-6">
              ritual · step one
            </p>
            <h2 className="font-serif-editorial text-5xl text-white mb-12 text-center">
              What shall we call them?
            </h2>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep('description')}
              placeholder="a name..."
              autoFocus
              className="ethereal-input text-center max-w-md"
            />
            {name.trim() && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setStep('description')}
                className="ritual-button mt-16"
              >
                continue
              </motion.button>
            )}
          </motion.div>
        )}

        {/* STEP 2: DESCRIPTION */}
        {step === 'description' && (
          <motion.div
            key="description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px"}}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-6">
              ritual · step two
            </p>
            <h2 className="font-serif-editorial text-5xl text-white mb-4 text-center max-w-2xl">
              Describe their essence.
            </h2>
            <p className="font-serif-editorial italic text-xl text-white/80 mb-12 text-center max-w-xl">
              Who are they? What do they believe? What haunts them?
              <br />The more precise your words, the more likely the consensus will converge.
            </p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="They are..."
              autoFocus
              rows={5}
              className="ethereal-input max-w-2xl resize-none"
              style={{ fontSize: '1.25rem' }}
            />
            {description.length > 30 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setStep('influences')}
                className="ritual-button mt-16"
              >
                continue
              </motion.button>
            )}
          </motion.div>
        )}

        {/* STEP 3: INFLUENCES */}
        {step === 'influences' && (
          <motion.div
            key="influences"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", overflowY: "auto"}}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-6">
              ritual · step three
            </p>
            <h2 className="font-serif-editorial text-5xl text-white mb-4 text-center">
              Choose their influences.
            </h2>
            <p className="font-serif-editorial italic text-xl text-white/80 mb-12 text-center">
              {selectedInfluences.length}/5 selected
            </p>
            <div className="flex flex-wrap gap-3 justify-center max-w-3xl mb-12">
              {INFLUENCES.map(inf => {
                const selected = selectedInfluences.includes(inf);
                return (
                  <button
                    key={inf}
                    onClick={() => toggleInfluence(inf)}
                    className={`px-4 py-2 text-base font-mono-soul transition-all duration-400 ${
                      selected
                        ? 'border border-[var(--amber)] text-[#d4a574] bg-[rgba(212,165,116,0.08)]'
                        : 'border border-[var(--border-faint)] text-white/80 hover:border-[var(--border-soft)] hover:text-white'
                    }`}
                  >
                    {inf}
                  </button>
                );
              })}
            </div>
            {selectedInfluences.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setStep('personality')}
                className="ritual-button"
              >
                continue
              </motion.button>
            )}
          </motion.div>
        )}

        {/* STEP 4: PERSONALITY */}
        {step === 'personality' && (
          <motion.div
            key="personality"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", overflowY: "auto"}}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-6">
              ritual · step four
            </p>
            <h2 className="font-serif-editorial text-5xl text-white mb-4 text-center">
              Set their boundaries.
            </h2>
            <p className="font-serif-editorial italic text-xl text-white/80 mb-12 text-center">
              Twelve dimensions · drag to shape who they are
            </p>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-3xl mb-12">
              {DIMENSIONS.map(dim => (
                <div key={dim}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm uppercase tracking-[0.2em] text-white/80">
                      {dim}
                    </span>
                    <span className="text-xs font-mono-soul text-[#d4a574]">
                      {personality[dim]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={personality[dim]}
                    onChange={e => setPersonality(prev => ({ ...prev, [dim]: parseInt(e.target.value) }))}
                    className="w-full h-px bg-[var(--border-soft)] appearance-none cursor-none
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-3
                               [&::-webkit-slider-thumb]:h-3
                               [&::-webkit-slider-thumb]:rounded-full
                               [&::-webkit-slider-thumb]:bg-[var(--amber)]
                               [&::-webkit-slider-thumb]:cursor-none"
                  />
                </div>
              ))}
            </div>
            <motion.button
              onClick={() => setStep('confirm')}
              className="ritual-button"
            >
              continue
            </motion.button>
          </motion.div>
        )}

        {/* STEP 5: CONFIRM */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px"}}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-6">
              ritual · final step
            </p>
            <h2 className="font-serif-editorial text-5xl text-white mb-12 text-center">
              Confirm the summoning.
            </h2>
            <div className="max-w-2xl text-center mb-12">
              <p className="font-serif-editorial text-5xl text-[#d4a574] mb-4">
                {name}
              </p>
              <p className="font-serif-editorial italic text-xl text-white/80 mb-6">
                {description}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {selectedInfluences.map(inf => (
                  <span key={inf} className="text-xs font-mono-soul text-white/80">
                    · {inf}
                  </span>
                ))}
              </div>
              <p className="text-xs font-mono-soul text-white/80 mt-8">
                cost · 0.023 GEN · 5 validators will attempt consensus
              </p>
              <p className="text-xs font-mono-soul text-white/80 opacity-60 mt-2">
                if consensus diverges, the soul will not exist
              </p>
            </div>
            <div style={{ marginBottom: 28 }}>
              <ConnectWallet />
            </div>
            <button
              onClick={startBirth}
              className="ritual-button pulse-amber"
            >
              summon
            </button>
          </motion.div>
        )}

        {/* STEP 6: BIRTHING */}
        {step === 'birthing' && (
          <motion.div
            key="birthing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px"}}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-[#d4a574] mb-6 breathe">
              consensus forming
            </p>
            <h2 className="font-serif-editorial text-5xl text-white mb-16 text-center italic">
              {name} is being born.
            </h2>

            {/* Validators in formation */}
            <div className="flex gap-12 mb-16">
              {validators.length === 0 ? (
                <>
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-[var(--text-secondary)] opacity-30" />
                  ))}
                </>
              ) : (
                validators.map(v => <ValidatorDot key={v.id} validator={v} size="large" />)
              )}
            </div>

            <div className="text-xs font-mono-soul text-white/80 space-y-2 text-center">
              {validators.map(v => (
                <motion.p
                  key={v.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: v.status === 'answered' ? 1 : 0.3 }}
                  className={v.status === 'answered' ? 'text-[#7d9b8e]' : ''}
                >
                  Validator {String(v.id + 1).padStart(2, '0')} · {v.model} · {v.status === 'answered' ? 'converged' : 'thinking...'}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 7: BORN */}
        {step === 'born' && createdSoul && (
          <motion.div
            key="born"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px"}}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="mb-8"
            >
              <div className="w-24 h-24 rounded-full pulse-amber" style={{
                background: 'var(--amber)',
                boxShadow: '0 0 60px var(--amber-glow), 0 0 120px var(--amber-glow)',
              }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 1.2 }}
              className="text-sm uppercase tracking-[0.3em] text-[#7d9b8e] mb-6"
            >
              consensus reached · 5/5 validators converged
            </motion.p>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 1.5 }}
              className="font-serif-editorial text-5xl text-[#d4a574] mb-4"
            >
              {createdSoul.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 1.5 }}
              className="font-serif-editorial italic text-xl text-white/80 mb-12 text-center max-w-xl"
            >
              {createdSoul.tagline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5, duration: 1.5 }}
              className="text-xs font-mono-soul text-white/80 mb-12 text-center"
            >
              birth hash · {createdSoul.birthHash}
              <br />
              <span className="opacity-60">on-chain · permanent · irreversible</span>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.5, duration: 1.5 }}
              onClick={() => onComplete(createdSoul)}
              className="ritual-button"
            >
              speak to them
            </motion.button>
          </motion.div>
        )}

        {/* STEP FAILED */}
        {step === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px"}}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-[#b76e4a] mb-6">
              {failReason === 'wallet' ? 'no wallet sealed' : 'consensus diverged'}
            </p>
            <h2 className="font-serif-editorial text-5xl text-white mb-4 text-center italic">
              {failReason === 'wallet' ? 'A soul needs a witness.' : `${name} could not exist.`}
            </h2>
            <p className="font-serif-editorial italic text-xl text-white/80 mb-12 text-center max-w-xl">
              {failReason === 'wallet' ? (
                <>
                  To summon a soul on the GenLayer Bradbury testnet, connect your wallet first.
                  The ritual is a real transaction, settled by validator consensus.
                  <br /><br />
                  Connect from the top of the limbo, then return and try again.
                </>
              ) : (
                <>
                  The validators could not agree on who this soul is.
                  The description was too ambiguous, or too contradictory, or too vast.
                  <br /><br />
                  This is not a failure of the protocol. This is the protocol working.
                  Not every fiction can be brought into being.
                </>
              )}
            </p>
            <button onClick={onCancel} className="ritual-button">
              return to the limbo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
