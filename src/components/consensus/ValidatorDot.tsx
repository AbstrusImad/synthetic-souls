'use client';

import type { Validator } from '@/types/soul';

export function ValidatorDot({ validator, size = 'normal' }: {
  validator: Validator;
  size?: 'normal' | 'large';
}) {
  const dimension = size === 'large' ? 'w-4 h-4' : 'w-2 h-2';
  const glowSize = size === 'large' ? 'w-12 h-12' : 'w-6 h-6';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      {/* Glow */}
      <div
        className={`absolute rounded-full transition-all duration-700 ${glowSize}`}
        style={{
          background: validator.status === 'answered'
            ? 'radial-gradient(circle, rgba(125, 155, 142, 0.3) 0%, transparent 70%)'
            : validator.status === 'thinking'
            ? 'radial-gradient(circle, rgba(212, 165, 116, 0.4) 0%, transparent 70%)'
            : validator.status === 'disagreed'
            ? 'radial-gradient(circle, rgba(139, 73, 67, 0.3) 0%, transparent 70%)'
            : 'transparent',
          animation: validator.status === 'thinking' ? 'pulse-amber 1.5s ease-in-out infinite' : 'none',
        }}
      />
      {/* Dot */}
      <div
        className={`relative rounded-full transition-all duration-700 ${dimension}`}
        style={{
          background: validator.status === 'answered'
            ? 'var(--moss)'
            : validator.status === 'thinking'
            ? 'var(--amber)'
            : validator.status === 'disagreed'
            ? 'var(--terracotta)'
            : 'var(--text-secondary)',
          opacity: validator.status === 'idle' ? 0.4 : 1,
        }}
      />
    </div>
  );
}
