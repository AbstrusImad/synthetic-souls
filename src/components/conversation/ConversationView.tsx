'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message, Soul, Validator, ConsensusState } from '@/types/soul';
import { ConsensusPanel } from '@/components/consensus/ConsensusPanel';
import { genlayer, getMessages } from '@/lib/genlayer';

export function ConversationView({ soul, onExit }: {
  soul: Soul;
  onExit: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [validators, setValidators] = useState<Validator[]>([]);
  const [consensusState, setConsensusState] = useState<ConsensusState>('idle');
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [fragments, setFragments] = useState<string[] | null>(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [gasCost, setGasCost] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, streamingText]);

  useEffect(() => {
    const t = setTimeout(() => setInputVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Load any prior on-chain conversation for this soul.
  useEffect(() => {
    let alive = true;
    getMessages(soul.id)
      .then(ms => { if (alive && ms.length) setMessages(ms); })
      .catch(() => {});
    return () => { alive = false; };
  }, [soul.id]);

  const sendMessage = async () => {
    if (!input.trim() || consensusState === 'thinking') return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setGasCost(prev => prev + 0.0023);

    let finalResponse: string | null = null;
    let divergedFragments: string[] | undefined;

    await genlayer.streamConsensus(
      soul,
      userMsg.content,
      (v, state, response, frags) => {
        setValidators(v);
        setConsensusState(state);
        if (response) finalResponse = response;
        if (frags) divergedFragments = frags;
      }
    );

    if (finalResponse) {
      setConsensusState('converged');
      const words = finalResponse.split(' ');
      let current = '';
      for (let i = 0; i < words.length; i++) {
        current = current ? current + ' ' + words[i] : words[i];
        setStreamingText(current);
        await new Promise(r => setTimeout(r, 60 + Math.random() * 80));
      }

      const soulMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'soul',
        content: finalResponse,
        timestamp: Date.now(),
        consensus: 'converged',
      };
      setMessages(prev => [...prev, soulMsg]);
      setStreamingText(null);
      setConsensusState('idle');
    } else if (divergedFragments) {
      setFragments(divergedFragments);
    }
  };

  const handleFragmentSelect = (fragment: string) => {
    const soulMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'soul',
      content: fragment,
      timestamp: Date.now(),
      consensus: 'converged',
    };
    setMessages(prev => [...prev, soulMsg]);
    setFragments(null);
    setConsensusState('idle');
    setGasCost(prev => prev + 0.0050);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      zIndex: 50,
    }}>
      {/* Left: Conversation */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minWidth: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 40px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <button
            onClick={onExit}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: 13,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: 'none',
              padding: 0,
              transition: 'color 0.4s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#d4a574')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)')}
          >
            ← return to the limbo
          </button>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 42,
            color: '#d4a574',
            marginTop: 16,
            fontWeight: 400,
            lineHeight: 1.1,
          }}>
            {soul.name}
          </h1>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.75)',
            marginTop: 6,
          }}>
            {soul.tagline}
          </p>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 40px',
          }}
          className="hide-scrollbar"
        >
          {messages.length === 0 && !streamingText && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: 28,
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 1.3,
                }} className="breathe">
                  {soul.name} is here.
                </p>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: 16,
                }} className="breathe">
                  Speak, if you wish.
                </p>
              </div>
            </div>
          )}

          {messages.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 24,
              }}
            >
              <div style={{
                maxWidth: '70%',
                textAlign: m.role === 'user' ? 'right' : 'left',
              }}>
                <p style={{
                  fontFamily: m.role === 'user' ? 'JetBrains Mono, monospace' : 'Cormorant Garamond, serif',
                  fontSize: m.role === 'user' ? 15 : 22,
                  color: m.role === 'user' ? 'rgba(255, 255, 255, 0.85)' : '#ffffff',
                  lineHeight: m.role === 'user' ? 1.5 : 1.6,
                  margin: 0,
                }}>
                  {m.content}
                </p>
                {m.role === 'soul' && m.consensus === 'converged' && (
                  <p style={{
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'rgba(125, 155, 142, 0.9)',
                    marginTop: 10,
                  }}>
                    consensus reached · 5/5 validators
                  </p>
                )}
              </div>
            </motion.div>
          ))}

          {/* Streaming response */}
          {streamingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: 24,
              }}
            >
              <div style={{ maxWidth: '70%' }}>
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 22,
                  color: '#ffffff',
                  lineHeight: 1.6,
                  margin: 0,
                }} className="typewriter-cursor">
                  {streamingText}
                </p>
              </div>
            </motion.div>
          )}

          {/* Disagreement fragments */}
          {fragments && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginBottom: 24 }}
            >
              <p style={{
                fontSize: 12,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#b76e4a',
                marginBottom: 12,
              }}>
                consensus diverged · {fragments.length} versions exist
              </p>
              <p style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 16,
              }}>
                Strengthen one to resolve:
              </p>
              {fragments.map((f, i) => (
                <button
                  key={i}
                  onClick={() => handleFragmentSelect(f)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'transparent',
                    color: '#ffffff',
                    cursor: 'none',
                    marginBottom: 10,
                    transition: 'border-color 0.3s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#d4a574')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                >
                  <p style={{
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: '0 0 8px 0',
                  }}>
                    version {i + 1}
                  </p>
                  <p style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic',
                    fontSize: 18,
                    color: '#ffffff',
                    margin: 0,
                  }}>
                    {f}
                  </p>
                </button>
              ))}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <AnimatePresence>
          {inputVisible && !fragments && consensusState !== 'thinking' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ padding: '16px 40px 32px' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 16,
                borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'border-color 0.4s ease',
              }}>
                <span style={{
                  color: '#d4a574',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 18,
                  paddingBottom: 14,
                }}>→</span>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="speak..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 22,
                    color: '#ffffff',
                    padding: '12px 0',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {consensusState === 'thinking' && (
          <div style={{ padding: '0 40px 24px' }}>
            <p style={{
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#d4a574',
            }} className="breathe">
              consensus forming...
            </p>
          </div>
        )}
      </div>

      {/* Right: Consensus Panel */}
      <div style={{
        width: '40%',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(13, 13, 20, 0.4)',
        backdropFilter: 'blur(20px)',
      }}>
        <ConsensusPanel
          validators={validators}
          state={consensusState}
          gasCost={gasCost}
        />
      </div>
    </div>
  );
}
