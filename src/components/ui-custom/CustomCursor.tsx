'use client';

import { useEffect, useState } from 'react';

interface TrailPoint {
  id: number;
  x: number;
  y: number;
}

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const pointId = useState(() => ({ current: 0 }))[0];

  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    let lastTrailTime = 0;

    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setHidden(false);

      // Throttle trail updates
      const now = Date.now();
      if (now - lastTrailTime > 40) {
        lastTrailTime = now;
        pointId.current++;
        const newPoint = { id: pointId.current, x: e.clientX, y: e.clientY };
        setTrail(prev => [...prev.slice(-10), newPoint]);
      }
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [data-cursor="expand"]')) {
        setExpanded(true);
      } else {
        setExpanded(false);
      }
    };

    const handleLeave = () => setHidden(true);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleOver);
    document.body.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
      document.body.removeEventListener('mouseleave', handleLeave);
    };
  }, [pointId]);

  if (hidden) return null;

  return (
    <>
      <div
        className={`custom-cursor ${expanded ? 'expanded' : ''}`}
        style={{ left: position.x, top: position.y }}
      />
      {trail.map((p, i) => (
        <div
          key={p.id}
          className="custom-cursor-trail"
          style={{
            left: p.x,
            top: p.y,
            opacity: (i / trail.length) * 0.5,
            transform: `translate(-50%, -50%) scale(${0.3 + (i / trail.length) * 0.7})`,
          }}
        />
      ))}
    </>
  );
}
