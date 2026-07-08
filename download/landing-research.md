# SaaS Landing Page CSS & Design Research Report

> Fetched & analyzed: Linear, Vercel, Resend, Lemon Squeezy, Omniroute (sections + components + tokens)
> Date: 2026-07-02

---

## 1. Hero Section Patterns

### Linear (`linear.app`)
**Layout:** Two-column grid (`grid-template-columns: 1fr 1fr`) — text left, interactive app-frame mockup right. On ≤1024px collapses to single column.
**Key CSS:**
```css
/* Header grid — 50/50 split */
.b-30Va_header {
  grid-template-columns: 1fr 1fr;
  align-items: start;
  padding-bottom: 96px;
  display: grid;
}
/* Section wrapper */
.b-30Va_root {
  margin-inline: auto;
  padding-top: 128px;
  padding-bottom: 128px;
}
```
- Title max-width: ~38ch description text (`max-width: 38ch`)
- App-frame mockup uses `--width: 1320px; --height: 720px; --app-radius: 12px` with internal sidebar grid
- Background: `radial-gradient(52.53% 57.5% at 50% 100%, #08090a00 0%, #08090a80 100%), linear-gradient(180deg, #08090a 10%, var(--color-text-secondary) 100%)`
- CTA wrapper has `margin-top: 48px` (24px on ≤1024px)
- Responsive: Mobile reverses column order (`flex-direction: column-reverse`)

### Vercel (`vercel.com`)
**Layout:** Full-width centered hero with shader/canvas background element. Single-column text centered, with a visual canvas element behind/above.
**Key CSS:**
```css
/* Hero canvas constraints */
--hero-canvas-max: 720px;
--hero-zoom-freeze-h: 560px;
--hero-shader-y-offset: 20px;

/* Noise texture overlay */
background-image: url(fallback-dark-noise.webp);
background-size: 70px 70px;
mix-blend-mode: multiply;
opacity: 0.42;

/* Passport glow animation */
@keyframes passport-glow-ellipse-x {
  from { transform: scaleX(1); }
  to { transform: scaleX(1.5); }
}
```
- Background color: `rgb(250, 250, 250)` — pure white
- Header: `sticky top-0`, transparent bg, adds shadow on scroll: `data-[scrolled]:shadow-[0_1px_0_0_var(--ds-gray-alpha-400)]`
- Page width: `--geist-page-width: 1200px` with `--geist-page-margin` for horizontal padding

### Resend (`resend.com`)
**Layout:** Dark full-bleed background (#000) with centered text + 3D Spline cube visual.
**Key CSS:**
```css
/* Body */
background: #000;

/* Nav blur */
header::after {
  background: black/60;
  backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity;
}

/* Radial glow on hero */
background: radial-gradient(70% 80% at center 0%,
  rgba(255,255,255,0.06) 3%,
  rgba(98, 255, 179, 0) 70%);

/* 3D Spline loaded only on desktop */
<link as="fetch" href="/static/cube.splinecode" media="(min-width: 1024px)" rel="preload">

/* Gradient border effect */
background: border-box linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0));
--border-color: conic-gradient(from var(--angle) at 50% 50%, #000 0%, #000 80%, #000 100%);
```
- Theme color: `#000000`, color scheme: `dark`
- Hero text has `max-width: 34ch` for tight column
- Glassmorphism nav with `backdrop-filter: blur(12px)` and `rgba(0,0,0,0.6)` overlay

### Lemon Squeezy (`lemonsqueezy.com`)
**Layout:** Two-column grid with 5rem gap, text left, oversized product image right.
**Key CSS:**
```css
.home-header_component {
  grid-column-gap: 5rem;
  grid-row-gap: 5rem;
  grid-template-columns: 1fr 1fr;
  place-content: center;
  align-items: center;
  padding-top: 6.5rem;
  padding-bottom: 4rem;
  display: grid;
}

/* Entrance animations via inline styles (Webflow IX2) */
h1 { transform: translate3d(0, 4rem, 0); opacity: 0; }
p  { transform: translate3d(0, 3rem, 0); opacity: 0; }
.btn { transform: translate3d(0, 2.5rem, 0); opacity: 0; }
/* Animate to: translate3d(0,0,0) opacity: 1 */
```
- Product image extends 250% width: `width: 250%; max-width: 1440px; position: absolute; inset: auto -38.1rem -5rem auto`
- Announcement banner at top with golden highlight
- Nav entrance: `transform: translate3d(0, -1.5rem, 0); opacity: 0`

### Omniroute (`omniroute.online`)
**Layout:** Split grid — 1.05fr/0.95fr on desktop.
**Key CSS:**
```css
.hero {
  padding-block: clamp(1.5rem, 4.2vw, 3.3rem);
}
.hero__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2rem, 5vw, 3.5rem);
  align-items: center;
}
@media (min-width: 880px) {
  .hero__grid {
    grid-template-columns: 1.05fr 0.95fr;
  }
}
```

---

## 2. Typography System

### Linear
- **Font:** `InterVariable.woff2` (custom variable font), preloaded
- **Font sizes (design tokens):**
  - `--font-size-micro: .75rem` (12px)
  - `--font-size-mini: .8125rem` (13px)
  - `--font-size-small: .875rem` (14px)
  - `--font-size-regular: 1rem` (16px)
- **Button font sizes:** 12px (mini/small), 13px (small/medium), 15px (default), 16px (large)
- **Font weights:** `--font-weight-medium`, `--font-weight-semibold`
- **Letter spacing:** Negative tracking on headings (tight)
- **Line height:** `text-wrap: balance` on description paragraphs
- **Feature settings:** `font-variant-numeric: tabular-nums slashed-zero` on numbers

### Vercel (Geist Design System)
- **Font:** Geist Sans (variable) + Geist Mono
- **Font sizes found:** 10px, 11px, 12px, 13px, 14px, 15px, 16px, 18px, `.75rem`, `.8rem`, `.875rem`, `1rem`, `1.25rem`, `1.5rem`, `1.8rem`
- **Copy sizes:** `text-copy-14` (14px) is the body standard
- **Icon sizes:** `--geist-icon-size: 16px` (default)
- **Tabular nums:** `font-feature-settings: tnum` on mono elements

### Resend
- **Font:** System sans-serif stack
- **Text colors (dark mode):** `#EBECED` (primary), `#A0A0A0` (secondary), `#6C6C6C` (muted), `rgb(255, 255, 146)` (yellow highlights)
- **Body class:** `font-sans text-gray-12 antialiased`
- **Selection color:** `selection:bg-black/10 selection:text-black` (dark: `selection:bg-white/20`)

### Lemon Squeezy
- **Font:** `Circularpro book, sans-serif` (custom Webflow font)
- **Fluid typography with viewport calc:**
  ```css
  /* Base 1rem on ≥1280px, scales down */
  @media (max-width: 1280px) { html { font-size: calc(0.17rem + 1.04vw); } }
  @media (max-width: 991px)  { html { font-size: calc(0.88rem + 0.20vw); } }
  @media (max-width: 768px)  { html { font-size: calc(0rem + 2.08vw); } }
  @media (max-width: 480px)  { html { font-size: calc(-0.01rem + 4.14vw); } }
  ```
- **Headings:**
  - `.heading-xlarge`: `font-size: 3.5rem; line-height: 1.125; letter-spacing: -0.03em`
  - `.heading-large`: `font-size: 3rem; line-height: 1.25`
  - `.heading-medium`: `font-size: 2.4rem; line-height: 1.2`
- **Font smoothing:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`
- **Font feature:** `font-feature-settings: "ss04"` on h1/h2/h3 (stylistic set 4)

### Omniroute
- **Font stack:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, sans-serif`
- **Fluid type scale using clamp():**
  ```css
  --step--1: clamp(0.8rem, 0.78rem + 0.1vw, 0.85rem);   /* 12.8–13.6px */
  --step-0:  clamp(0.95rem, 0.9rem + 0.25vw, 1.05rem);   /* 15.2–16.8px */
  --step-1:  clamp(1.1rem, 1rem + 0.5vw, 1.3rem);        /* 17.6–20.8px */
  --step-2:  clamp(1.4rem, 1.2rem + 1vw, 2rem);          /* 22.4–32px */
  --step-3:  clamp(1.8rem, 1.4rem + 2vw, 2.8rem);        /* 28.8–44.8px */
  --step-4:  clamp(2.4rem, 1.8rem + 3vw, 4rem);          /* 38.4–64px */
  --step-6:  clamp(3.5rem, 2.5rem + 6vw, 7rem);          /* 56–112px (giant numbers) */
  ```
- **Letter spacing:** `-0.01em` to `-0.02em` on headings, `0.04em` to `0.07em` on uppercase labels

---

## 3. Color & Gradient Techniques

### Linear (Dark Theme)
```css
/* App frame surfaces */
--bg-base: #0f1011;
--bg-shade: #191d20;
border: 1px solid #ffffff14;  /* 8% white border */
background: #ffffff08;        /* 3% white background */
background: #ffffff0a;        /* 4% white hover */
background: #ffffff0d;        /* 5% white active */
box-shadow: 0 0 0 1px #0003; /* subtle outer shadow */
box-shadow: inset 0 0 12px #0003; /* inset depth */

/* Brand badge gradient borders */
--gradientBorder-gradient: linear-gradient(285.49deg, #bac0cb -14.61%, #767caf 106.06%); /* Business */
--gradientBorder-gradient: linear-gradient(92.88deg, #be05ff 9.16%, #a954ff 43.89%, #a771ff 64.72%); /* Enterprise */

/* Glow effect */
background: radial-gradient(50% 50%, #ffffff0a 0%, #fff0 90%); /* 400px circle glow */
border-radius: 400px;

/* Text gradient (shimmer animation) */
background: linear-gradient(-.6turn, var(--color-text-tertiary) 0%, var(--color-text-quaternary) 60%, ...);
background-size: 300%;
animation: 2.2s linear infinite shine;
```
- **Theme color:** `#08090a` (near-black), `#090a0b` (frame bg)
- **Grain texture:** `mix-blend-mode: overlay; opacity: 0.9; background-size: 256px 256px`

### Vercel (Light Theme)
```css
/* Core grays */
--ds-background-100: #fff;
--ds-background-200: #fafafa;
--ds-gray-100: #f2f2f2;
--ds-gray-1000: #171717;

/* Alpha channels (used everywhere for borders/hover) */
--ds-gray-alpha-100: #0000000d;  /* 5% black */
--ds-gray-alpha-200: #00000015;  /* 8% */
--ds-gray-alpha-300: #0000001a;  /* 10% */
--ds-gray-alpha-400: #00000014;  /* 8% */
--ds-gray-alpha-600: #0000003d;  /* 24% */

/* Blue accent */
--ds-blue-700: #0070f7;

/* Focus ring */
box-shadow: 0 0 0 2px var(--ds-background-100), 0 0 0 4px var(--ds-focus-color);
```
- **Noise texture:** 70px × 70px repeating noise pattern, `mix-blend-mode: multiply; opacity: 0.42`

### Resend (Dark)
```css
/* Colors */
--bg: #000000;
--text-primary: #EBECED;
--text-secondary: #A0A0A0;
--text-muted: #6C6C6C;
--highlight: rgb(255, 255, 146);  /* yellow glow */

/* Radial glow from top */
background: radial-gradient(70% 80% at center 0%,
  rgba(255,255,255,0.06) 3%,
  rgba(98, 255, 179, 0) 70%,
  rgba(98, 255, 179, 0) 100%);

/* Rotating conic-gradient border */
--border-color: conic-gradient(from var(--angle) at 50% 50%, #000 0%, #000 80%, #000 100%);

/* Fade-to-black bottom overlay */
background-image: linear-gradient(180deg,
  rgba(0,0,0,0) 0%,
  #000000 50%,
  #000000 100%);
```

### Lemon Squeezy
```css
/* Brand colors */
--ls-color-yellow: #ffc233;
--ls-color-yellow-lighter: #ffd266;
--ls-purple: #5423e7;

/* Buttons */
--button-primary-light: (yellow #ffc233);
color: var(--black-2);  /* dark text on yellow */
border-radius: 2.5rem;  /* full pill */
```
- Clean, bright color palette — purple + yellow brand
- Minimal use of gradients (mostly flat colors)

### Omniroute
```css
/* Brand gradients */
--primary: #e54d5e;
--accent: #6366f1;
--accent-3: #a855f7;
--grad-brand: linear-gradient(135deg, var(--primary), var(--accent-3));
--grad-soft: linear-gradient(135deg, rgba(229, 77, 94, 0.12), rgba(168, 85, 247, 0.12));

/* Surfaces */
--bg: #0b0e14;
--surface: #161b22;
--surface-2: #1c2230;
--border: rgba(255, 255, 255, 0.08);
--border-strong: rgba(255, 255, 255, 0.14);

/* Grid background */
--grid-line: rgba(255, 255, 255, 0.06);
--grid-size: 32px;

/* Section alt */
--section-alt: rgba(255, 255, 255, 0.018);
```

---

## 4. Spacing System

### Common Patterns Across All Sites

| Element | Linear | Vercel | Resend | Lemon | Omniroute |
|---------|--------|--------|--------|-------|-----------|
| **Container max-width** | `--homepage-max-width` | `1200px` | `max-w-5xl` / `md:max-w-7xl` | 1440px (image) | `1180px` |
| **Section padding (desktop)** | `128px` top/bottom | — | — | `6.5rem` top / `4rem` bottom | `clamp(1.5rem, 4.2vw, 3.3rem)` |
| **Section padding (mobile)** | `48px` top / `96px` bottom | — | — | — | Same clamp |
| **Hero grid gap** | `32px` (column gap) | — | — | `5rem` | `clamp(2rem, 5vw, 3.5rem)` |
| **Card gap** | `12px` (board cards), `16px` (chart cards) | — | — | — | `1.5rem` (`--gap`) |
| **Element gap** | `6–8px` (buttons), `2px` (nav items) | `0.75rem` (nav) | — | `.75rem` (button icon gap) | `0.5–1.1rem` |
| **Nav height** | 56px (implied) | `--header-height` (custom) | — | ~64px | `64px` (`--nav-h`) |

### Key Spacing Techniques
1. **Fluid clamping everywhere:** `clamp(min, preferred, max)` for section padding, gaps, and font sizes
2. **Vercel** uses `content-visibility: auto` with `contain-intrinsic-size` for performance (e.g., `auto 618px`, `auto 772px`, `auto 480px`)
3. **Linear** uses `var(--homepage-outer-padding)` and `var(--homepage-padding-inset)` for consistent horizontal spacing
4. **Omniroute** uses `max-width: 60ch` / `64ch` for text column constraints

---

## 5. Card & Component Design

### Linear Cards
```css
/* Board cards */
.dxvWiq_card {
  border: var(--border-hairline) solid var(--color-border-translucent);
  background: #1b1c1d;
  border-radius: 6px;
  padding: 8px 10px 12px 12px;
  box-shadow: 0 2px 4px #0006;
  transform: translateZ(0); /* GPU layer */
}

/* Chart cards */
.XD5sSa_card {
  border: var(--border-hairline) solid var(--color-border-translucent-strong);
  border-radius: 12px;
  padding: 20px 24px 22px;
}

/* Labels/badges */
.dxvWiq_label {
  border: var(--border-hairline) solid var(--color-border-translucent);
  background: var(--color-bg-translucent);
  border-radius: 2px;
  padding-inline: 2px 8px;
  box-shadow: 0 1.2px #00000008;
}
```

### Linear Buttons
```css
/* Primary button — glass morphism */
.S36ykG_variant-primary {
  color: var(--color-brand-text);
  background: var(--color-brand-bg);
  border: none;
  /* Hover: filter: brightness(115%) */
  /* Active: transform: scale(0.97) */
}

/* Secondary — glass effect */
.S36ykG_variant-secondary {
  background: var(--color-bg-translucent);
  backdrop-filter: blur(4px);
  box-shadow:
    inset 0 0 0 1px #ffffff08,
    inset 0 1px #ffffff0a,
    0 0 0 1px #0009,
    0 4px 4px #0000001a;
}

/* Sizes */
/* mini:  h=24px, font=12px, pad=0 10px */
/* small: h=32px, font=13px, pad=0 12px */
/* medium: h=40px, font=13px, pad=0 14px */
/* default: h=40px, font=15px, pad=0 16px */
/* large: h=44px, font=16px, pad=0 20px */

/* Transition: .16s var(--ease-out-quad) on all */
/* Active state: scale(0.97) — the "press" feel */
```

### Lemon Squeezy Buttons
```css
.button-primary {
  background-color: var(--button-primary-light);  /* yellow */
  color: var(--black-2);
  border-radius: 2.5rem;  /* full pill */
  font-weight: 500;
  letter-spacing: -0.01em;
  display: flex;
  position: relative;
  z-index: 0;
}

/* Overlay effect on hover */
.button-primary:hover .button-primary-overlay {
  transform: translate(-0.5rem, -0.5rem);
}
.button-primary:hover .button-primary-icon {
  transform: translate(0.5rem, 0);
}
```

### Omniroute Buttons
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.62rem 1.1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);  /* 9px */
  font-weight: 700;
  font-size: var(--step-0);
  line-height: 1;
  transition: background 0.18s var(--ease),
    border-color 0.18s var(--ease),
    transform 0.18s var(--ease),
    box-shadow 0.18s var(--ease);
}

/* Hover: translateY(-1px) — subtle lift */
/* Active: translateY(0) — press back */
```

### Omniroute Cards
```css
.card {
  border: 1px solid var(--border);
  border-radius: var(--radius);  /* 14px */
  background: var(--surface);
  padding: 1.4rem;
  transition: border-color 0.18s var(--ease),
    background 0.18s var(--ease),
    transform 0.18s var(--ease);
}
.card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

/* Gradient text for stats */
.card__stat strong {
  background: var(--grad-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

### Omniroute Chips/Pills
```css
.chip--accent {
  border-color: color-mix(in srgb, var(--accent-3) 45%, transparent);
  background: var(--grad-soft);
  color: var(--text);
  font-weight: 700;
}
```

---

## 6. Animation & Motion

### Linear
| Pattern | Value | Usage |
|---------|-------|-------|
| **Default transition** | `.16s var(--ease-out-quad)` | All interactive elements |
| **Hover brightness** | `filter: brightness(115%)` | Primary buttons |
| **Active scale** | `transform: scale(0.97)` | All button variants |
| **Text shimmer** | `background-size: 300%; animation: 2.2s linear infinite` | Gradient text badges |
| **Stagger entrance** | `@keyframes staggerIn { from { opacity:0; translateY(4px) } } .4s ease-out backwards` | Chat list items |
| **Dots reveal** | `clip-path: inset(0 100% 0 0); 2.1s step-end infinite` | Typing indicator |
| **Menu appear** | `opacity: 0; transform: scale(0.9); transition: .16s` | Dropdown menus |
| **Toast slide** | `transform: translateY(100%); transition: .4s` | Notifications |

### Vercel
| Pattern | Value | Usage |
|---------|-------|-------|
| **Glow pulse** | `@keyframes passport-glow-ellipse-x { from { scaleX(1) } to { scaleX(1.5) } }` | Hero visual |
| **Content visibility** | `content-visibility: auto; contain-intrinsic-size: auto 618px` | Below-fold sections |
| **Nav shadow on scroll** | `data-[scrolled]:shadow-[0_1px_0_0_var(--ds-gray-alpha-400)]` | Sticky header |
| **Noise texture** | `background-size: 70px 70px; mix-blend-mode: multiply; opacity: 0.42` | Subtle grain |

### Resend
| Pattern | Value | Usage |
|---------|-------|-------|
| **Rotating border** | `conic-gradient(from var(--angle) at 50% 50%, ...)` with CSS `@property` animation | Card borders |
| **Radial glow** | `radial-gradient(70% 80% at center 0%, rgba(255,255,255,0.06) 3%, transparent 70%)` | Hero ambient light |
| **Fade bottom** | `linear-gradient(180deg, transparent 0%, #000 50%, #000 100%)` | Section transitions |
| **3D Spline** | Loaded as `.splinecode`, `media="(min-width: 1024px)"` | Hero visual |

### Lemon Squeezy
| Pattern | Value | Usage |
|---------|-------|-------|
| **Stagger slide-up** | `translate3d(0, 4rem→0); opacity: 0→1` on h1, p, btn | Hero entrance |
| **Nav slide-down** | `translate3d(0, -1.5rem→0); opacity: 0→1` | Nav entrance |
| **Image slide-right** | `translate3d(3rem, 3rem→0); opacity: 0→1` | Hero image entrance |
| **Button icon shift** | `.button-primary:hover .icon { transform: translate(0.5rem, 0) }` | Arrow nudge |
| **Secondary icon scroll** | `.button-secondary:hover .icon-row { transform: translate(0, 1.3rem) }` | Icon chain |

### Omniroute
| Pattern | Value | Usage |
|---------|-------|-------|
| **Card hover lift** | `transform: translateY(-2px); border-color: var(--border-strong)` | Feature cards |
| **Scroll reveal** | `--reveal-dur: 600ms; --ease: cubic-bezier(0.22, 1, 0.36, 1)` | All sections |
| **Marquee** | `animation: marquee-scroll 38s linear infinite; translateX(0→-50%)` | Logo strip |
| **CLI logo hover** | `transform: translateY(-2px); border-color: var(--primary)` | Tool badges |
| **Video play hover** | `transform: scale(1.05)` on thumb, `scale(1.1)` on play button | Video cards |
| **Nav glass** | `backdrop-filter: saturate(180%) blur(14px)` on scroll | Sticky nav |

---

## 7. Top 5 Design Techniques That Make These Pages Stand Out

### 1. **Grain/Noise Texture Overlay (Linear + Vercel)**
Adds analog warmth and visual depth to clean digital interfaces. Linear uses `mix-blend-mode: overlay; opacity: 0.9; background-size: 256px` while Vercel uses `mix-blend-mode: multiply; opacity: 0.42; background-size: 70px`. This single technique elevates a flat design to "premium."

### 2. **Glassmorphism with Multi-Layer Inset Shadows (Linear)**
```css
box-shadow:
  inset 0 0 0 1px #ffffff08,    /* inner border glow */
  inset 0 1px #ffffff0a,          /* top light edge */
  0 0 0 1px #0009,               /* outer border */
  0 4px 4px #0000001a;           /* drop shadow */
```
This 4-layer shadow creates a realistic frosted glass effect on secondary buttons and cards.

### 3. **Staggered Slide-Up Entrance Animations (Lemon Squeezy)**
Each hero element (h1 → p → CTA → image) animates in from below with decreasing offset (4rem → 3rem → 2.5rem). This creates a cinematic "reveal" that guides the eye naturally. Simple but extremely effective.

### 4. **Gradient Border Technique via Mask Composite (Linear)**
```css
.gradientBorder::before {
  padding: var(--gradientBorder-size, 1px);
  background: var(--gradientBorder-gradient);
  mask-image: linear-gradient(#000, #000), linear-gradient(#000, #000);
  mask-position: 0 0, 0 0;
  mask-size: auto, auto;
  mask-clip: content-box, border-box;
  mask-composite: exclude;
}
```
Creates gradient borders (purple/blue for Enterprise, silver for Business) without extra DOM elements.

### 5. **Ambient Radial Glow (Resend)**
```css
background: radial-gradient(70% 80% at center 0%,
  rgba(255,255,255,0.06) 3%,
  rgba(98, 255, 179, 0) 70%);
```
A soft, barely-visible glow from the top of the hero creates depth and draws the eye to the center. Combined with the 3D Spline cube, it creates a sense of physical space.

---

## 8. Exact CSS Snippets for Bus Station Landing Page

### 8.1 Hero Section (Linear-Inspired Split Layout)
```css
.hero {
  padding-block: clamp(3rem, 8vw, 8rem);
}
.hero__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2rem, 5vw, 3.5rem);
  align-items: center;
}
@media (min-width: 880px) {
  .hero__grid {
    grid-template-columns: 1.05fr 0.95fr;
  }
}
.hero__title {
  font-size: var(--step-4);        /* clamp(2.4rem, 1.8rem + 3vw, 4rem) */
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  max-width: 20ch;                 /* tight column for impact */
}
.hero__subtitle {
  color: var(--text-muted);
  font-size: var(--step-1);        /* clamp(1.1rem, 1rem + 0.5vw, 1.3rem) */
  line-height: 1.6;
  max-width: 44ch;
  text-wrap: balance;
}
.hero__ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
```

### 8.2 Noise/Grain Overlay (Linear + Vercel Technique)
```css
.grain {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
  opacity: 0.4;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}
```

### 8.3 Glassmorphism Nav on Scroll (Resend + Omniroute)
```css
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--nav-h);
  display: flex;
  align-items: center;
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  border-bottom: 1px solid transparent;
  transition: background 0.25s var(--ease),
    border-color 0.25s var(--ease),
    backdrop-filter 0.25s var(--ease);
}
.nav.is-scrolled {
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom-color: var(--border);
}
```

### 8.4 Premium Button System (Linear-Inspired)
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.62rem 1.4rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 700;
  font-size: var(--step-0);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.18s var(--ease),
    border-color 0.18s var(--ease),
    transform 0.18s var(--ease),
    box-shadow 0.18s var(--ease);
}

/* Primary — brand gradient */
.btn--primary {
  background: var(--grad-brand);
  color: #fff;
  box-shadow: 0 4px 14px -4px var(--primary);
}
.btn--primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px -4px var(--primary);
}
.btn--primary:active {
  transform: scale(0.97) translateY(0);
}

/* Secondary — glass */
.btn--secondary {
  background: var(--surface);
  color: var(--text);
  backdrop-filter: blur(4px);
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,0.06),
    0 0 0 1px rgba(0,0,0,0.3),
    0 4px 4px rgba(0,0,0,0.1);
}
.btn--secondary:hover {
  background: var(--surface-2);
  transform: translateY(-1px);
}

/* Large CTA variant */
.btn--cta {
  padding: 0.85rem 2rem;
  font-size: var(--step-1);
  border-radius: 999px;            /* pill shape for hero CTAs */
}
```

### 8.5 Feature Cards with Hover Lift
```css
.card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 1.4rem;
  transition: border-color 0.18s var(--ease),
    background 0.18s var(--ease),
    transform 0.18s var(--ease);
}
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }
}

/* Gradient stat numbers */
.card__stat strong {
  font-size: var(--step-2);
  background: var(--grad-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

### 8.6 Gradient Border Badge (Linear Enterprise Style)
```css
.badge--gradient {
  position: relative;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
  background: var(--surface);
}
.badge--gradient::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(135deg, var(--primary), var(--accent-3));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

### 8.7 Ambient Hero Glow (Resend-Inspired)
```css
.hero::before {
  content: "";
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 140%;
  height: 70%;
  background: radial-gradient(
    70% 80% at center 0%,
    rgba(229, 77, 94, 0.06) 3%,
    rgba(168, 85, 247, 0) 60%
  );
  pointer-events: none;
  z-index: 0;
}
```

### 8.8 Marquee Logo Strip (Omniroute Pattern)
```css
.marquee {
  overflow: hidden;
  border-block: 1px solid var(--border);
  background: var(--surface);
  -webkit-mask-image: linear-gradient(
    90deg, transparent, black 8%, black 92%, transparent
  );
  mask-image: linear-gradient(
    90deg, transparent, black 8%, black 92%, transparent
  );
}
.marquee__track {
  display: flex;
  width: max-content;
  animation: marquee-scroll 38s linear infinite;
}
.marquee:hover .marquee__track {
  animation-play-state: paused;
}
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

### 8.9 Staggered Entrance Animation (Lemon Squeezy-Inspired)
```css
/* Apply via JS IntersectionObserver or CSS animation-delay */
.hero__title {
  animation: slide-up 0.8s var(--ease) 0.1s both;
}
.hero__subtitle {
  animation: slide-up 0.8s var(--ease) 0.25s both;
}
.hero__ctas {
  animation: slide-up 0.8s var(--ease) 0.4s both;
}
.hero__visual {
  animation: slide-up 0.8s var(--ease) 0.3s both;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(2.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Cubic ease-out for spring feel */
/* --ease: cubic-bezier(0.22, 1, 0.36, 1); */
```

### 8.10 App Frame Mockup (Linear-Inspired Product Preview)
```css
.frame-wrapper {
  --width: 100%;
  --height: auto;
  --app-radius: 12px;
  --frame-padding: 8px;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}
.frame {
  width: var(--width);
  max-width: 1320px;
  min-width: 280px;
  border-radius: var(--app-radius);
  background: var(--surface);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
  overflow: hidden;
}
.frame__glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 400px;
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    50% 50%,
    rgba(255,255,255,0.04) 0%,
    transparent 90%
  );
  pointer-events: none;
}
```

---

## Summary: Design System Recommendations for Bus Station Landing

| Aspect | Recommendation | Source |
|--------|---------------|--------|
| **Theme** | Dark-first with light toggle | Linear, Resend, Omniroute |
| **Font** | Inter variable + JetBrains Mono | Linear, Omniroute |
| **Hero layout** | 2-column grid (text left, visual right) | Linear, Lemon, Omniroute |
| **Hero title size** | `clamp(2.4rem, 1.8rem + 3vw, 4rem)`, weight 800, tracking -0.03em | Linear, Lemon |
| **Body text** | `clamp(0.95rem, 0.9rem + 0.25vw, 1.05rem)`, weight 400, `text-wrap: balance` | Linear, Omniroute |
| **Container** | `max-width: 1180px` with `clamp` padding | Omniroute, Vercel |
| **Section spacing** | `clamp(4rem, 8vw, 8rem)` top/bottom | Linear |
| **Card radius** | 12–14px | Linear, Omniroute |
| **Button radius** | 9px (standard) / 999px (hero CTA pills) | Omniroute, Lemon |
| **Border treatment** | `rgba(255,255,255,0.08)` with hover to 0.14 | Linear, Omniroute |
| **Gradient brand** | `linear-gradient(135deg, primary, accent)` | Omniroute |
| **Glow effects** | Radial gradient `rgba(primary, 0.06)` at hero top | Resend |
| **Grain texture** | SVG noise, `mix-blend-mode: overlay`, 256px tile | Linear |
| **Entrance animation** | Staggered `translateY(2.5rem→0)` with spring easing | Lemon |
| **Hover feedback** | `translateY(-1px)` lift + `border-color` brighten | Omniroute, Linear |
| **Active feedback** | `scale(0.97)` press | Linear |
| **Nav scroll** | `backdrop-filter: saturate(180%) blur(14px)` | Omniroute, Resend |
| **Marquee** | 38s infinite scroll, edge fade mask | Omniroute |