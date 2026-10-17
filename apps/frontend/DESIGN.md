# Design System: ApexStore

## 1. Visual Theme & Atmosphere

A refined, gallery-airy e-commerce interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is warm and premium — like a well-lit architecture studio meets a boutique storefront. Density: balanced (5). Variance: offset asymmetric (6). Motion: fluid CSS (5).

## 2. Color Palette & Roles

- **Canvas** (#0a0f1c) — Primary background surface, deep off-black
- **Pure Surface** (#ffffff) — Card and container fill (rarely used)
- **Card Glass** (rgba(20, 28, 45, 0.75)) — Translucent card surfaces
- **Charcoal Ink** (#f3f4f6) — Primary text (light text on dark background)
- **Muted Steel** (#9ca3af) — Secondary text, descriptions, metadata
- **Whisper Border** (rgba(255, 255, 255, 0.08)) — Card borders, 1px structural lines
- **Burnished Gold** (#c0843e) — Single accent for CTAs, active states, focus rings

Max 1 accent. Saturation below 80%. No purple/blue neon. No pure black (#000000).

## 3. Typography Rules

- **Display:** Geist — Track-tight, controlled scale, weight-driven hierarchy. Not screaming.
- **Body:** Geist — Relaxed leading, 65 characters max line width, Muted Steel secondary color.
- **Mono:** Geist Mono — For metadata, timestamps, codes.
- **Banned:** Inter font. Generic serif fonts in dashboards/software UIs.

## 4. Component Stylings

- **Buttons:** Flat, no outer glow. Tactile -1px translate on active. Accent fill for primary, ghost/outline for secondary.
- **Cards:** Generously rounded corners. Diffused whisper shadow. Used only when elevation serves hierarchy. High-density: replace with border-top dividers.
- **Inputs:** Label above, error below. Focus ring in accent color. No floating labels.
- **Loaders:** Skeletal shimmer matching exact layout dimensions. No circular spinners.
- **Empty States:** Composed compositions indicating how to populate data — not just "No data" text.
- **Error States:** Clear, inline error reporting below the field.

## 5. Layout Principles

- Grid-first responsive architecture. Asymmetric splits for form sections.
- Strict single-column collapse below 768px. No exceptions.
- Max-width containment (1400px centered).
- No flexbox percentage math. Never `calc()` percentage hacks.
- Full-height sections use `min-h-[100dvh]` — never `h-screen`.
- No overlapping elements — every element occupies its own clean spatial zone.

## 6. Motion & Interaction

- Spring physics default: stiffness 100, damping 20. No linear easing.
- Staggered cascade reveals — never mount lists instantly.
- Perpetual micro-interactions on active components (pulse, float, shimmer).
- Animate exclusively via `transform` and `opacity`. Never `top`, `left`, `width`, `height`.

## 7. Anti-Patterns (Banned)

- No emojis anywhere
- No Inter font
- No pure black (#000000)
- No neon/outer glow shadows
- No oversaturated accents (saturation >= 80%)
- No excessive gradient text on large headers
- No custom mouse cursors
- No overlapping elements — clean spatial separation always
- No 3-column equal card layouts
- No generic names ("John Doe", "Acme", "Nexus")
- No fake round numbers (`99.99%`, `50%`)
- No fabricated data or statistics — use `[metric]` placeholders if real data unavailable
- No fake system/metric sections ("SYSTEM PERFORMANCE METRICS", "BY THE NUMBERS")
- No `LABEL // YEAR` formatting ("SYSTEM // 2024")
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No filler UI text ("Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons)
- No broken Unsplash links — use `picsum.photos` or SVG avatars
- No centered Hero sections (variance exceeds 4)
