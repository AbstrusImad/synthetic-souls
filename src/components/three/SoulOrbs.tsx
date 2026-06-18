'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { Soul } from '@/types/soul';

interface OrbData {
  id: string;
  position: [number, number, number];
  scale: number;
  color: string;
  soul: Soul;
}

// Pastel palette — soft, delicate tones
const PASTEL_COLORS = [
  '#a8e6cf', // mint
  '#ffd1dc', // soft pink
  '#b3e5fc', // soft blue
  '#fff9c4', // pale yellow
  '#c8e6c9', // sage
  '#e1bee7', // lilac
  '#ffe0b2', // pale orange
  '#d1c4e9', // lavender
  '#f8bbd0', // pink
  '#b2dfdb', // teal
];

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return PASTEL_COLORS[Math.abs(h) % PASTEL_COLORS.length];
}

function SoulOrb({ data, onClick, isHovered, setHovered }: {
  data: OrbData;
  onClick: () => void;
  isHovered: boolean;
  setHovered: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Per-orb subtle phase
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const floatSpeed = useMemo(() => 0.15 + Math.random() * 0.2, []);
  const floatAmp = useMemo(() => 0.08 + Math.random() * 0.1, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Very gentle floating — subtle drift
      groupRef.current.position.x = data.position[0] + Math.sin(t * floatSpeed + phase) * floatAmp;
      groupRef.current.position.y = data.position[1] + Math.cos(t * floatSpeed * 0.8 + phase) * floatAmp;
      groupRef.current.position.z = data.position[2] + Math.sin(t * floatSpeed * 0.6 + phase * 1.3) * floatAmp * 0.5;
    }
    if (glowRef.current) {
      // Gentle pulse
      const pulse = (Math.sin(t * 0.5 + phase) + 1) * 0.5;
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isHovered ? 0.55 + pulse * 0.15 : 0.22 + pulse * 0.08;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.08);
    }
    if (coreRef.current) {
      // Smooth hover scale — gentle, not aggressive
      const targetScale = isHovered ? data.scale * 1.6 : data.scale;
      coreRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hit area — matches the visible glow size, so hover/click works on the entire visible orb (core + glow) */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(data.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(null);
        }}
        scale={data.scale * 3.5}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Glow halo — soft, larger than core */}
      <mesh ref={glowRef} scale={data.scale * 3.5}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={data.color}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orb core — small, bright */}
      <mesh ref={coreRef} scale={data.scale}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={data.color} transparent opacity={1} />
      </mesh>
    </group>
  );
}

function Scene({ souls, onSelectSoul, hovered, setHovered }: {
  souls: Soul[];
  onSelectSoul: (id: string) => void;
  hovered: string | null;
  setHovered: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Extremely slow ambient rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.008;
    }
  });

  const orbs: OrbData[] = useMemo(() => {
    const n = souls.length;
    const radius = Math.max(8, Math.sqrt(n) * 2.5);

    return souls.map((soul, i) => {
      // Fibonacci sphere
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      // Small sizes with subtle variation
      const baseScale = 0.08;
      const variation = (soul.conversations / 200) * 0.06;
      const scale = baseScale + Math.min(0.10, variation);

      return {
        id: soul.id,
        position: [x * radius, y * radius, z * radius] as [number, number, number],
        scale,
        color: pickColor(soul.id + soul.name),
        soul,
      };
    });
  }, [souls]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <group ref={groupRef}>
        {orbs.map(orb => (
          <SoulOrb
            key={orb.id}
            data={orb}
            onClick={() => onSelectSoul(orb.id)}
            isHovered={hovered === orb.id}
            setHovered={setHovered}
          />
        ))}
      </group>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.1}
        rotateSpeed={0.3}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI * 2 / 3}
      />
    </>
  );
}

export function SoulOrbs({ souls, onSelectSoul, hovered, setHovered }: {
  souls: Soul[];
  onSelectSoul: (id: string) => void;
  hovered: string | null;
  setHovered: (id: string | null) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 22], fov: 50 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000000',
      }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#000000']} />
      <Scene
        souls={souls}
        onSelectSoul={onSelectSoul}
        hovered={hovered}
        setHovered={setHovered}
      />
    </Canvas>
  );
}
