# Synthetic Souls

> Consensus ghosts — fictions made real by decentralized agreement.

Plataforma web donde los usuarios crean "almas sintéticas" (personajes ficticios persistentes) mediante consenso AI simulado en GenLayer, y luego conversan con ellas. La personalidad del alma emerge del consenso de 5 validadores AI (GPT-4, Claude, Llama, Gemini, Mistral) — si convergen, el alma nace on-chain; si divergen, no existe.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **3D:** React Three Fiber + @react-three/drei + three
- **Animaciones:** Framer Motion + GSAP
- **Visualizaciones:** D3.js
- **Styling:** Tailwind CSS + CSS custom properties
- **Fonts:** Cormorant Garamond (serif editorial), Inter (display), JetBrains Mono (mono)

## Instalación

```bash
# Con bun (recomendado)
bun install
bun run dev

# O con npm
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura

```
src/
├── app/
│   ├── globals.css          # Estilos globales, paleta, animaciones
│   ├── layout.tsx           # Layout root con fuentes
│   └── page.tsx             # Página principal (orquesta 4 pantallas)
├── components/
│   ├── three/
│   │   └── SoulOrbs.tsx     # Escena 3D con orbes (Limbo)
│   ├── consensus/
│   │   ├── RitualFlow.tsx       # Creación de alma (7 pasos)
│   │   ├── ConsensusPanel.tsx   # Panel derecho de validadores
│   │   └── ValidatorDot.tsx     # Dot de validador
│   ├── conversation/
│   │   └── ConversationView.tsx  # Chat split view
│   ├── mirror/
│   │   ├── MirrorView.tsx       # Perfil del alma
│   │   └── PersonalityRadar.tsx # Radar D3.js
│   └── ui-custom/
│       ├── CustomCursor.tsx     # Cursor custom ámbar
│       └── ParticleBackground.tsx # Partículas canvas
├── lib/
│   └── genlayer.ts          # Mock del SDK de GenLayer
├── types/
│   └── soul.ts              # Tipos TypeScript
└── hooks/
```

## Pantallas

1. **Limbo** (home) — Escena 3D con orbes de luz pastel flotando sobre fondo negro. Hover sobre un orbe muestra el nombre del alma siguiendo al cursor. Click navega al Mirror.

2. **Ritual** (crear alma) — Flujo de 7 pasos:
   - Nombre
   - Descripción (essence)
   - Influences (5 máximo)
   - Personalidad (12 dimensiones con sliders)
   - Confirm
   - Birthing (animación de consensus de 5 validadores)
   - Born/Failed

3. **Session** (conversación) — Split 60/40:
   - Izquierda: mensajes streaming tipográficos del alma
   - Derecha: panel de consensus con 5 validadores en tiempo real
   - Disagreement → 3 versiones para elegir

4. **Mirror** (perfil) — 2 columnas:
   - Izquierda: identidad, descripción, traits dominantes, influences
   - Derecha: radar D3.js + birth certificate

## Estética: "Ethereal Consensus Terminal"

- **Fondo:** Negro absoluto (#000000)
- **Texto:** Blanco/ámbar
- **Acento:** Ámbar sepia (#d4a574)
- **Paleta orbes pastel:** verde claro, rosa, azul, amarillo, lila, naranja
- **Tipografía:** Cormorant Garamond (italic) + Inter + JetBrains Mono
- **Cursor custom ámbar** con trail de partículas

## Mock de GenLayer SDK

El archivo `src/lib/genlayer.ts` es un mock que simula:
- `listSouls()` — lista almas existentes (6 seed)
- `getSoul(id)` — obtiene un alma por ID
- `createSoul(data)` — crea nueva alma (90% éxito)
- `streamConsensus(soul, message, onUpdate)` — simula consensus de 5 validadores
- `streamBirthConsensus(soulData, onUpdate)` — simula consensus de nacimiento

6 almas seed: Kaspar Voss, Mira the Synth, Brother Aldous, Yuki of the Snow, The Botanist, Dr. Halberg.

## Para conectar GenLayer real

Reemplaza el mock en `src/lib/genlayer.ts` con llamadas al SDK `@genlayer/sdk` real:

```bash
bun add @genlayer/sdk
```

La API del mock está diseñada para ser compatible con el SDK real:
- `listSouls()` → llama al contrato Intelligent Contract
- `createSoul()` → ejecuta transacción con Equivalence Principle
- `streamConsensus()` → suscripción a eventos de consensus

## Scripts

```bash
bun run dev      # Desarrollo
bun run build    # Build producción
bun run start    # Run producción
bun run lint     # ESLint
```

## Licencia

Proyecto de investigación — Z.ai Research · Junio 2026
