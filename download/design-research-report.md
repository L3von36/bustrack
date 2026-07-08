# Modern SaaS Dashboard & Landing Page Design Research Report

> **Date**: July 2026  
> **Sources**: Linear, Vercel, Raycast, Cal.com, Mintlify, SaaSUI.Design, Code Theorem, FontOfWeb, Refero Styles, DesignLang  
> **Screenshots**: Saved to `/home/z/my-project/download/ref-{linear,vercel,raycast,calcom}.png`

---

## 1. Landing Page Patterns

### 1.1 What Makes Linear's Landing Page Beautiful

**Hero Layout:**
- Full-width hero with animated gradient mesh background (signature purple-to-violet gradient)
- Centered headline with **very large display text** (60-72px / 3.75-4.5rem)
- Subheadline in muted secondary color, 18-20px, max-width ~640px centered
- Single primary CTA button with subtle glow effect, placed directly below subheadline
- A second text-link style CTA ("Watch demo" / "Read docs") beside the primary button
- Below the fold: a large, high-fidelity product screenshot/video embedded in a browser-frame mockup with subtle drop shadow

**Typography:**
- Font: **Inter Variable** (variable font with optical sizing)
- Headlines: Font-weight 500-600, letter-spacing -0.02em to -0.03em (tight tracking)
- Body: Font-weight 400, line-height 1.6
- Monospace code accents: **Berkeley Mono** for code snippets and keyboard shortcuts

**Color Usage:**
- Background: Deep near-black `#08090A` (Void)
- Text primary: `#E5E5E6` (soft white, not pure white)
- Text secondary: `#8A8F98` (muted gray)
- Accent: Electric violet/purple gradient `#6366F1` → `#8B5CF6`
- Status colors: Green `#27A644`, Red `#EB5757`, Cyan `#02B8CC`, Yellow-Green `#E4F222`

**Spacing:**
- Hero section vertical padding: 120px top / 80px bottom (desktop)
- Content max-width: 1200px with 24px side padding
- Section spacing: 80-120px between major sections
- Generous whitespace is used as a *functional tool*, not decoration

**Animation Patterns:**
- Subtle CSS gradient animation on hero background (6-10s loop)
- Framer Motion for scroll-triggered fade-in/slide-up animations
- 200-300ms ease-out transitions on interactive elements
- Product screenshots fade in with slight scale (0.98 → 1.0)
- Smooth scroll behavior throughout

**CTA Placement:**
- Primary: Inline button in hero (above fold)
- Secondary: Sticky in top nav bar (appears on scroll)
- Tertiary: Repeated at section boundaries ("Get started" / "Start for free")
- Footer: Full navigation + CTA row

---

### 1.2 What Makes Vercel's Landing Page Beautiful

**Hero Layout:**
- Black background with grid-pattern overlay and subtle radial gradient glow
- Bold, very large headline with gradient text effect (white → gray)
- Clean grid of feature cards below the hero, no excessive chrome
- "Deploy" / "Get Started" prominent CTAs

**Typography:**
- Font: **Geist** (Vercel's custom font family — sans + mono)
- Geist Sans for body, Geist Mono for code
- Headlines: Font-weight 700, letter-spacing -0.025em
- Very tight line-height on headlines (1.1)
- Body text at 16px with 1.6 line-height

**Color Usage:**
- Background: Pure `#000000`
- Text: `#FAFAFA` primary, `#888888` secondary
- Accent: Vercel triangle logo as brand mark
- Borders: `#333333` subtle separators
- Success/active indicators: `#0070F3` (Vercel blue)

**Spacing:**
- Content constrained to max-width 1120px
- Grid gap: 16-24px
- Cards use 24px internal padding
- Section vertical rhythm: 96-128px

**Animation Patterns:**
- Instant load — Vercel prioritizes perceived performance
- Subtle hover effects on cards (border color change, slight lift)
- No heavy scroll animations — performance-first approach

**CTA Placement:**
- Top-right nav: "Log In" + "Sign Up" (high contrast)
- Hero: Large "Start Deploying" button
- Inline CTAs within feature sections

---

### 1.3 What Makes Raycast's Landing Page Beautiful

**Hero Layout:**
- Dark background with dynamic product showcase video/animation
- "Your shortcut to everything" tagline — concise value proposition
- Product demo embedded as hero element (not a static screenshot)
- Grid of integration logos below the fold for social proof

**Typography:**
- Font: **Inter** for headings, system font stack for body
- Large hero text (56-64px), bold weight
- Clean hierarchy with color contrast for emphasis

**Color Usage:**
- Background: Very dark gray `#141414`
- Text: White `#FFFFFF` primary, `#A0A0A0` secondary
- Accent: Gradient purple-blue for highlights
- Clean, high-contrast dark theme throughout

**Spacing:**
- Very generous vertical spacing (100px+ between sections)
- Cards and features well-separated
- Max-width ~1080px for content

**Animation Patterns:**
- Product demo as animated hero (not screenshot)
- Smooth scroll-triggered reveals
- Hover micro-interactions on feature cards

**CTA Placement:**
- "Download for free" primary CTA (macOS-native feel)
- "Watch video" secondary link
- Clean navigation with minimal items

---

### 1.4 What Makes Cal.com's Landing Page Beautiful

**Hero Layout:**
- Clean white/light background with colorful accent elements
- Two-column hero: headline text left, product visual right
- Clear value proposition with supporting social proof logos
- Video demo prominently featured

**Typography:**
- Font: **Inter** / system font stack
- Large bold headlines (48-56px)
- Colorful text accents for emphasis words
- Clean, readable body text

**Color Usage:**
- Background: White `#FFFFFF` with subtle gray sections
- Text: `#111827` primary, `#6B7280` secondary
- Accent: Cal.com brand blue `#292929` with colorful feature highlights
- Gradient accents for visual interest

**Spacing:**
- Well-structured grid layouts
- Feature sections with 64-96px vertical spacing
- Card grid with 16-24px gaps

**CTA Placement:**
- "Start for free" prominent in hero and nav
- "Get started" repeated at section ends
- Social proof directly supporting CTA decisions

---

### 1.5 Landing Page Pattern Summary Table

| Pattern | Linear | Vercel | Raycast | Cal.com |
|---|---|---|---|---|
| **Theme** | Dark | Dark | Dark | Light |
| **Hero BG** | Gradient mesh | Grid + glow | Product video | White + visual |
| **Headline Size** | 60-72px | 56-64px | 56-64px | 48-56px |
| **Primary Font** | Inter Variable | Geist | Inter | Inter |
| **CTA Style** | Glowing button | Solid white | Download button | Blue filled |
| **Social Proof** | Customer logos | Framework logos | Integration logos | Customer logos |
| **Animation** | Gradient + scroll | Minimal/hover | Product demo + scroll | Subtle transitions |
| **Max Width** | 1200px | 1120px | 1080px | 1200px |

---

## 2. Dashboard Design Patterns

### 2.1 What Makes Modern Dashboards Look Premium

Based on analysis of Linear's app interface, Vercel's dashboard, and 2025-2026 SaaS design trends from SaaSUI.Design, Code Theorem, and Mintlify:

#### 2.1.1 Sidebar Design

**The "Calm Sidebar" Pattern (Linear-inspired):**

The 2026 Linear design refresh (published March 2026) explicitly made the sidebar *dimmer* — "a few notches dimmer, allowing the main content area to take precedence." Key principles:

- **Width**: 240px collapsed, 280px expanded (desktop). On smaller screens: icon-only 56px rail.
- **Background**: Uses the deepest background color (e.g., `#08090A` or `#0F1011` — literally darker than the main content area)
- **Text**: Secondary/muted color for nav labels (not white) — `#8A8F98` in dark mode
- **Active item**: Subtle highlight — not a bold colored bar, but a soft background pill (e.g., `rgba(255,255,255,0.06)`)
- **Hover state**: Very subtle background change `rgba(255,255,255,0.04)`
- **Icons**: Small (16-18px), line-style, uniform stroke width. No colored backgrounds behind icons — scale them down instead.
- **Grouping**: Nav items grouped with 4-8px spacing between groups, small section headers in uppercase 11px, letter-spacing 0.05em, color `#62666D`
- **No borders**: The sidebar separates from content through background contrast alone, not borders
- **Bottom section**: User avatar + settings at bottom, separated by flex-grow spacer

**The Vercel Sidebar Pattern:**
- Slightly more prominent than Linear's
- Uses `#111111` background in dark mode
- Navigation items with left-border accent for active state
- Collapsible with icon-only mode
- Team/organization switcher at top

#### 2.1.2 Card Layouts

**Premium Card System:**
- **Background**: Slightly elevated from page background — `#161718` on a `#0F1011` page
- **Border**: 1px solid `rgba(255,255,255,0.06)` — barely visible, felt not seen
- **Border Radius**: `8px` (small/medium), `12px` (large/feature cards), `16px` (modals/panels)
- **Padding**: `16px` internal, `24px` for larger cards
- **Shadow**: No shadow in dark mode (borders do the work). In light mode: `0 1px 2px rgba(0,0,0,0.05)`
- **Hover**: Subtle border brighten to `rgba(255,255,255,0.12)` with 150ms transition
- **Gap between cards**: `12-16px` in grids
- **Card types**:
  - **KPI Card**: Icon + label (muted, 12px) + value (large, 24-32px bold) + change indicator (colored arrow + percentage)
  - **List Card**: Header row + scrollable list items with hover states
  - **Chart Card**: Small title + chart with minimal axes
  - **Action Card**: Title + description + CTA button

#### 2.1.3 Data Visualization

**2026 Best Practices:**
- Minimal chart chrome — remove gridlines, axis labels where possible
- Use color sparingly: 1 primary data color + 1 secondary, with muted grays for reference lines
- Sparklines over full charts for sidebar/brief views
- Consider **no charts at all** for non-analytical roles — show actionable numbers instead
- Real-time updates with subtle number transitions (counting animations)
- Use progress bars / progress rings for simple percentage displays
- Tooltip on hover only — never clutter the chart with data labels

**Chart Color Palette (Dark Mode):**
```
Primary data:   #6366F1 (indigo)
Secondary data: #8B5CF6 (violet)
Tertiary:       #02B8CC (cyan)
Success:        #27A644 (green)
Warning:        #E4F222 (yellow-green)
Error:          #EB5757 (red)
Grid/axis:      rgba(255,255,255,0.06)
Text labels:    #8A8F98
```

#### 2.1.4 Spacing System

**4px Base Grid (Linear/System scale):**
```
--space-0:   0px
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
```

**Key spacing rules:**
- Card internal padding: `16px` (compact) / `24px` (comfortable)
- Sidebar item padding: `6px 12px` (compact) / `8px 12px` (default)
- Page content padding: `24px 32px`
- Table row height: `40-44px` (compact) / `48px` (comfortable)
- Section gaps in dashboard: `24-32px`
- Input field padding: `8px 12px`
- Button padding: `6px 14px` (sm) / `8px 16px` (md) / `10px 20px` (lg)

#### 2.1.5 Typography Hierarchy

**Font Stack (Inter Variable):**
```
Font family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

**Size Scale:**
```
--text-xs:    12px / 0.75rem    — Labels, badges, timestamps
--text-sm:    13px / 0.8125rem  — Secondary text, nav items, table cells
--text-base:  14px / 0.875rem   — Body text, descriptions, list items
--text-md:    15px / 0.9375rem  — Emphasized body, card titles
--text-lg:    16px / 1rem       — Section titles, input text
--text-xl:    18px / 1.125rem   — Page titles
--text-2xl:   20px / 1.25rem    — Dashboard card values
--text-3xl:   24px / 1.5rem     — Large KPI values
--text-4xl:   30px / 1.875rem   — Section headings
--text-5xl:   36px / 2.25rem    — Page headings
--text-display: 48-72px          — Hero/landing only
```

**Weight Scale:**
```
--font-normal:    400
--font-medium:    500
--font-semibold:  600
--font-bold:      700
```

**Line Height:**
```
--leading-none:    1.0    — Large numbers, badges
--leading-tight:   1.25   — Headings
--leading-snug:    1.375  — Subheadings
--leading-normal:  1.5    — Body text
--leading-relaxed: 1.625  — Long-form content
```

**Letter Spacing:**
```
--tracking-tighter:  -0.02em  — Large headings
--tracking-tight:    -0.01em  — Headings
--tracking-normal:    0em     — Body text
--tracking-wide:      0.02em  — Uppercase labels
--tracking-wider:     0.05em  — Section headers, categories
```

#### 2.1.6 Dark/Light Mode Treatment

**Dark Mode (Primary — recommended for dashboards):**

Linear's approach (from Refero Styles + Linear blog):
```
--bg-primary:     #08090A    (Void — deepest, sidebar)
--bg-secondary:   #0F1011    (Carbon — main content area)
--bg-tertiary:    #161718    (Elevated surfaces, cards)
--bg-quaternary:  #23252A    (Hover states, dropdowns)
--bg-active:      #383B3F    (Active item highlight)

--text-primary:   #E5E5E6    (Main text — slightly warm white)
--text-secondary: #8A8F98    (Muted text)
--text-tertiary:  #62666D    (Disabled, placeholder)
--text-quaternary:#D0D6E0    (Code/monospace text)

--border-primary: rgba(255,255,255,0.06)
--border-hover:   rgba(255,255,255,0.12)
--border-focus:   rgba(99,102,241,0.5)  (Indigo focus ring)
```

**Light Mode:**
```
--bg-primary:     #FFFFFF
--bg-secondary:   #F9FAFB
--bg-tertiary:    #F3F4F6
--bg-quaternary:  #E5E7EB

--text-primary:   #111827
--text-secondary: #6B7280
--text-tertiary:  #9CA3AF

--border-primary: rgba(0,0,0,0.06)
--border-hover:   rgba(0,0,0,0.12)
--border-focus:   rgba(99,102,241,0.5)
```

**Key dark mode principles (from Linear's 2026 refresh):**
- "Structure should be felt, not seen" — borders should round edges and soften contrast
- Don't compete for attention you haven't earned — non-task elements should recede
- Warmer grays reduce eye strain without looking muddy
- The sidebar is *darker* than content, pulling focus to the work area

---

## 3. Design System Recommendations

### 3.1 CSS Custom Properties (Design Tokens)

```css
:root {
  /* === Colors (Dark Mode Default) === */
  --color-bg-base:       #0A0A0B;
  --color-bg-surface:    #111113;
  --color-bg-elevated:   #1A1A1D;
  --color-bg-hover:      #222225;
  --color-bg-active:     #2A2A2E;
  --color-bg-inset:      #060607;

  --color-text-primary:   #EAEAEA;
  --color-text-secondary: #8B8D97;
  --color-text-tertiary:  #5C5E66;
  --color-text-inverse:   #111113;

  --color-border-default:  rgba(255, 255, 255, 0.06);
  --color-border-hover:    rgba(255, 255, 255, 0.10);
  --color-border-focus:    rgba(99, 102, 241, 0.50);
  --color-border-strong:   rgba(255, 255, 255, 0.15);

  --color-accent:          #6366F1;
  --color-accent-hover:    #818CF8;
  --color-accent-muted:    rgba(99, 102, 241, 0.15);
  --color-accent-subtle:   rgba(99, 102, 241, 0.08);

  --color-success:         #22C55E;
  --color-success-muted:   rgba(34, 197, 94, 0.15);
  --color-warning:         #F59E0B;
  --color-warning-muted:   rgba(245, 158, 11, 0.15);
  --color-error:           #EF4444;
  --color-error-muted:     rgba(239, 68, 68, 0.15);
  --color-info:            #06B6D4;
  --color-info-muted:      rgba(6, 182, 212, 0.15);

  /* === Typography === */
  --font-sans:   'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono:   'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  --text-xs:     0.75rem;    /* 12px */
  --text-sm:     0.8125rem;  /* 13px */
  --text-base:   0.875rem;   /* 14px */
  --text-md:     0.9375rem;  /* 15px */
  --text-lg:     1rem;       /* 16px */
  --text-xl:     1.125rem;   /* 18px */
  --text-2xl:    1.25rem;    /* 20px */
  --text-3xl:    1.5rem;     /* 24px */
  --text-4xl:    1.875rem;   /* 30px */
  --text-5xl:    2.25rem;    /* 36px */

  --leading-none:     1;
  --leading-tight:    1.25;
  --leading-snug:     1.375;
  --leading-normal:   1.5;
  --leading-relaxed:  1.625;

  --tracking-tighter: -0.02em;
  --tracking-tight:   -0.01em;
  --tracking-normal:   0;
  --tracking-wide:     0.02em;
  --tracking-wider:    0.05em;

  /* === Spacing (4px grid) === */
  --space-0:   0;
  --space-0.5: 2px;
  --space-1:   4px;
  --space-1.5: 6px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;

  /* === Border Radius === */
  --radius-none:  0;
  --radius-sm:    4px;
  --radius-md:    6px;
  --radius-lg:    8px;
  --radius-xl:    12px;
  --radius-2xl:   16px;
  --radius-full:  9999px;

  /* === Shadows === */
  --shadow-xs:    0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:    0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-lg:    0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-xl:    0 20px 25px rgba(0, 0, 0, 0.4), 0 8px 10px rgba(0, 0, 0, 0.3);
  --shadow-glow:  0 0 20px rgba(99, 102, 241, 0.15);
  --shadow-none:  none;

  /* === Transitions === */
  --duration-fast:    100ms;
  --duration-normal:  150ms;
  --duration-slow:    200ms;
  --duration-slower:  300ms;

  --ease-default:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === Layout === */
  --sidebar-width:       260px;
  --sidebar-collapsed:   60px;
  --header-height:       52px;
  --content-max-width:   1200px;
  --page-padding-x:      32px;
  --page-padding-y:      24px;
}
```

### 3.2 Gradient Usage

**Hero/Landing Gradients:**
```css
/* Linear-inspired mesh gradient */
--gradient-hero: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
                 radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.10) 0%, transparent 50%),
                 radial-gradient(ellipse at 50% 80%, rgba(6,182,212,0.08) 0%, transparent 50%);

/* Accent gradient for buttons/highlights */
--gradient-accent: linear-gradient(135deg, #6366F1, #8B5CF6);

/* Subtle card hover gradient */
--gradient-card-hover: linear-gradient(135deg, rgba(99,102,241,0.03), rgba(139,92,246,0.03));
```

**Dashboard Gradients (very restrained):**
- Use gradients ONLY for accent elements (brand marks, empty state illustrations, CTA buttons)
- NEVER use gradients for backgrounds, cards, or data visualization areas in the dashboard
- Keep data areas flat and clean — gradient = decoration = cognitive noise

### 3.3 Component-Specific Tokens

**Buttons:**
```css
/* Primary button */
.btn-primary {
  background: var(--color-accent);
  color: #FFFFFF;
  font-size: var(--text-sm);
  font-weight: 500;
  padding: 7px 14px;      /* 28px height total */
  border-radius: var(--radius-md);
  transition: all var(--duration-normal) var(--ease-default);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}

/* Secondary / Ghost button */
.btn-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-default);
  font-size: var(--text-sm);
  font-weight: 500;
  padding: 6px 14px;
  border-radius: var(--radius-md);
}
.btn-secondary:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
}

/* Danger button */
.btn-danger {
  background: var(--color-error-muted);
  color: var(--color-error);
  /* same sizing as secondary */
}
```

**Inputs:**
```css
.input {
  background: var(--color-bg-inset);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: 7px 12px;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast) var(--ease-default);
}
.input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}
.input::placeholder {
  color: var(--color-text-tertiary);
}
```

**Badges/Status:**
```css
.badge {
  font-size: var(--text-xs);
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  letter-spacing: var(--tracking-wide);
}
.badge-success { background: var(--color-success-muted); color: var(--color-success); }
.badge-warning { background: var(--color-warning-muted); color: var(--color-warning); }
.badge-error   { background: var(--color-error-muted);   color: var(--color-error); }
.badge-info    { background: var(--color-info-muted);    color: var(--color-info); }
```

---

## 4. Specific Patterns for Bus Station System

### 4.1 Role-Based Adaptive Interface Strategy

Based on the 2026 "Role-Based & Adaptive Interfaces" trend (SaaSUI.Design), each of the 5 roles should see a meaningfully different default view — not just different permissions, but a different *experience* tailored to their workflow.

---

### 4.2 Ticketer Interface

**Role Purpose**: Sell tickets to passengers at the counter or kiosk.

**Design Approach**: **POS-First / Transactional Interface**

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│ [Logo] Bus Station - Ticketer     [Shift] [User] ⌄  │  ← Slim header 52px
├──────┬───────────────────────────────────────────────┤
│      │  ┌─────────────────────────────────────────┐  │
│ Nav  │  │  Route: [Dropdown ▾]  Date: [Today  ▾]  │  │  ← Search/filter bar
│      │  └─────────────────────────────────────────┘  │
│      │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ Sell │  │  Trip 1  │ │  Trip 2  │ │  Trip 3  │     │  ← Trip cards grid
│ New  │  │ 10:00 AM │ │ 11:30 AM │ │ 01:00 PM │     │
│ Ticket│  │ A→B     │ │ A→C     │ │ A→D     │     │
│      │  │ 12/45    │ │ 8/30     │ │ 20/50    │     │
│ Recent│  │ [Select] │ │ [Select] │ │ [Select] │     │
│ Sales │  └──────────┘ └──────────┘ └──────────┘     │
│      │                                               │
│ (slim│  ┌─────────────────────────────────────────┐  │
│ 60px │  │  Seat Selection / Payment Modal         │  │
│ icon │  │  (appears when trip selected)           │  │
│ rail)│  └─────────────────────────────────────────┘  │
└──────┴───────────────────────────────────────────────┘
```

**Key Design Decisions**:
- **No sidebar** — Use icon rail (60px) or no nav at all for kiosk mode
- **Trip cards** should be LARGE and touch-friendly (min 44px tap targets)
- **Color coding**: Available = green accent, Almost full = yellow, Sold out = red/muted
- **Number display**: Seat counts should be 32px+ bold — this is the most-glanced data
- **One-click flow**: Select trip → Choose seats → Payment → Print ticket (max 3 screens)
- **Keyboard shortcuts**: F1=New ticket, F2=Search, F3=Recent, Esc=Cancel
- **Sound feedback**: Subtle chime on successful transaction
- **Big numbers for seat availability**: Use `--text-3xl` (24px) for seat counts
- **Status badges**: "On Time" (green), "Delayed" (yellow), "Cancelled" (red)

**Specific Tokens**:
```css
--ticketer-card-bg:       var(--color-bg-elevated);
--ticketer-card-padding:  16px;
--ticketer-card-radius:   var(--radius-lg); /* 8px */
--ticketer-card-gap:      12px;
--ticketer-seat-font:     var(--text-3xl);  /* 24px bold for seat counts */
--ticketer-accent:        var(--color-success); /* Green for availability */
```

---

### 4.3 Cashier Interface

**Role Purpose**: Handle cash payments, reconcile at end of shift, manage float.

**Design Approach**: **Financial Dashboard + Transaction Ledger**

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│ [Logo] Bus Station - Cashier     [Shift] [User] ⌄   │
├────────┬─────────────────────────────────────────────┤
│        │  Today's Summary                            │
│ Dashboard│ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ Reconcile│ │ ₦125,000 │ │   48     │ │  ₦2,604  │   │
│ Ledger  │ │ Revenue  │ │ Tickets  │ │ Avg/Tkt  │   │
│        │ │ +12% ↑   │ │          │ │          │   │
│ Reports │ └──────────┘ └──────────┘ └──────────┘   │
│        │                                             │
│ (240px │  Recent Transactions                        │
│ sidebar│  ┌────────────────────────────────────────┐  │
│ with   │  │ #TKT-0042  Lagos→Abuja   ₦5,000  ✓   │  │
│ labels)│  │ #TKT-0041  Port Harc→Lag  ₦7,500  ✓   │  │
│        │  │ #TKT-0040  Abuja→Kano     ₦3,500  ✓   │  │
│        │  └────────────────────────────────────────┘  │
│        │                                             │
│        │  [Open Register]  [Reconcile Shift]          │
└────────┴─────────────────────────────────────────────┘
```

**Key Design Decisions**:
- **KPI cards at top** — Revenue, ticket count, average fare. Large numbers.
- **Currency formatting**: ₦ symbol, thousands separator, 2 decimal places
- **Transaction table**: Compact rows (40px height), zebra striping very subtle
- **Status indicators**: Checkmark green for completed, Clock yellow for pending, X red for voided
- **Reconciliation view**: Side-by-side "Expected" vs "Actual" with diff highlighting
- **Color for money**: Green for income, Red for expenses/refunds, Gray for neutral
- **Keyboard shortcut**: Ctrl+R = Open register, Ctrl+Shift+E = End shift

**Specific Tokens**:
```css
--cashier-revenue-color: var(--color-success);
--cashier-expense-color: var(--color-error);
--cashier-kpi-font:      var(--text-3xl);  /* 24px */
--cashier-kpi-label:     var(--text-xs);   /* 12px */
```

---

### 4.4 Gateman Interface

**Role Purpose**: Validate tickets at the gate, manage boarding, track departures.

**Design Approach**: **Operational / Scanner-First Interface**

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│ [Logo] Gate A - Departures    [Scanner 📷] [User ⌄  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  NEXT DEPARTURE                              │   │
│  │  Route: Lagos → Abuja   |   Bus: ABC-123     │   │
│  │  Departure: 10:00 AM    |   Gate: A          │   │
│  │  Status: ● BOARDING     |   Boarded: 32/45   │   │
│  │                                              │   │
│  │  ████████████████████░░░░░░  71% boarded      │   │
│  │                                              │   │
│  │  [Mark All Boarded]  [Report Issue]           │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Recent Scans                                        │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🎫 TKT-0042  Seat 12A  ✓ Valid   10:01:23   │   │
│  │ 🎫 TKT-0039  Seat  8B  ✓ Valid   10:01:18   │   │
│  │ 🎫 TKT-0001  Seat  3C  ✗ Expired  10:01:05   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Key Design Decisions**:
- **Full-width, NO sidebar** — Gateman needs maximum screen real estate
- **Giant next-departure card** — This is THE information that matters
- **Progress bar** for boarding percentage (large, colored, impossible to miss)
- **Scanner button** always visible in header (dedicated hardware button too)
- **Validation feedback**: Green flash + chime for valid, Red flash + buzz for invalid
- **Time-based urgency**: Card turns yellow when < 10 min to departure
- **Very large text** — Readable from 1-2 meters away (operator stands back)
- **Status**: "Waiting" (gray), "Boarding" (green pulse), "Departed" (blue), "Cancelled" (red)
- **Auto-refresh**: Departure info updates every 5 seconds

**Specific Tokens**:
```css
--gateman-departure-font:   var(--text-4xl);  /* 30px for route name */
--gateman-time-font:        var(--text-5xl);  /* 36px for departure time */
--gateman-status-boarding:  var(--color-success);
--gateman-status-urgent:    var(--color-warning);
--gateman-progress-height:  12px;
--gateman-scan-valid:       var(--color-success);
--gateman-scan-invalid:     var(--color-error);
--gateman-min-font-size:    16px;  /* Everything at least 16px for distance readability */
```

---

### 4.5 Manager Interface

**Role Purpose**: Oversee station operations, manage staff, view analytics.

**Design Approach**: **Command Center / Analytics Dashboard**

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│ [Logo] Station Manager    [Cmd+K]  [🔔] [User] ⌄    │
├────────┬─────────────────────────────────────────────┤
│        │  Station Overview           [Today ▾]       │
│ Overview│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│ Trips  │  │ Revenue│ │Trips/Day│ │On-Time%│ │Staff On││
│ Staff  │  │₦485K  │ │  64    │ │  94%   │ │  8/10  ││
│ Routes │  │+8%↑   │ │ +3↑    │ │ -1%↓   │ │        ││
│ Finance│  └────────┘ └────────┘ └────────┘ └────────┘│
│ Reports│                                              │
│        │  Departure Board                            │
│ Settings│ ┌──────────────────────────────────────────┐│
│        │ │ Route         Time   Status   Boarded   ││
│        │ │ Lagos→Abuja   10:00  ●On Time  32/45    ││
│        │ │ PH→Lagos      10:30  ◐Boarding 20/50    ││
│        │ │ Abuja→Kano    11:00  ○Scheduled --/40   ││
│        │ └──────────────────────────────────────────┘│
│        │                                              │
│        │  Revenue Trend          Staff Performance   │
│        │  ┌─────────────────┐   ┌─────────────────┐  │
│        │  │ 📈 mini chart    │   │ 📊 performance   │  │
│        │  └─────────────────┘   └─────────────────┘  │
└────────┴─────────────────────────────────────────────┘
```

**Key Design Decisions**:
- **Full sidebar** (240px) — Manager needs access to all station data
- **KPI row** at top — 4 cards with sparkline trends
- **Departure board** — Table view of all departures, real-time status
- **Two-column layout below**: Charts side by side (revenue + staff)
- **Command palette (Cmd+K)** — Quick access to any action across the system
- **Drill-down**: Click any KPI card → detailed view for that metric
- **Date range selector** in header area for time-based filtering
- **Notifications bell** for alerts (delayed trips, staff issues, revenue anomalies)

**Specific Tokens**:
```css
--manager-kpi-grid:        4 columns, 12px gap;
--manager-chart-height:    200px;
--manager-table-row:       44px height;
--manager-accent-chart:    var(--color-accent);  /* #6366F1 for primary chart line */
```

---

### 4.6 Superadmin Interface

**Role Purpose**: Manage multiple stations, system settings, user roles, global analytics.

**Design Approach**: **Enterprise Admin Panel — Maximum Control**

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│ [Logo] Super Admin Panel     [Cmd+K]  [⚙] [User] ⌄ │
├────────┬─────────────────────────────────────────────┤
│        │  Global Overview                            │
│        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│
│ Dashboard│ │Stations│ │Revenue │ │  Users │ │ Trips  ││
│ Stations│ │   12   │ │ ₦2.4M  │ │   86   │ │  1,240 ││
│ Users  │  │ 2 new  │ │+15%↑   │ │ +5 new │ │ +45↑   ││
│ Roles  │  └────────┘ └────────┘ └────────┘ └────────┘│
│ Trips  │                                              │
│ Routes │  Station Performance              [Export ⬇] │
│ Finance│  ┌──────────────────────────────────────────┐│
│ Audit  │  │ Station    Revenue  Trips  On-Time  Staff││
│ Settings│  │ Lagos Main ₦890K   210    96%     10/12 ││
│ System │  │ Abuja      ₦650K   180    92%     8/10  ││
│        │  │ PH Central ₦420K   120    88%     6/8   ││
│        │  └──────────────────────────────────────────┘│
│        │                                              │
│        │  System Health                               │
│        │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│        │  │ API 99.9%│ │DB 45ms   │ │Queue 0.2s│     │
│        │  │ ●Healthy │ │ ●Normal  │ │ ●Normal  │     │
│        │  └──────────┘ └──────────┘ └──────────┘     │
└────────┴─────────────────────────────────────────────┘
```

**Key Design Decisions**:
- **Full sidebar with icons + labels** (260px) — Many sections to navigate
- **Breadcrumbs** below header for deep navigation context
- **Data tables** with sorting, filtering, pagination, and bulk actions
- **System health indicators** — Green/Yellow/Red status dots
- **Export functionality** on all data views (CSV, PDF)
- **Audit log** — Immutable record of all system changes
- **Multi-station comparison** — Charts comparing station performance
- **Settings organized in tabs** (General, Security, Integrations, Billing)
- **Confirmation dialogs** for destructive actions (delete station, remove user)
- **Role management matrix** — Visual grid of permissions per role

**Specific Tokens**:
```css
--superadmin-table-header:  var(--text-xs);  /* 12px uppercase */
--superadmin-health-good:   var(--color-success);
--superadmin-health-warn:   var(--color-warning);
--superadmin-health-crit:   var(--color-error);
```

---

### 4.7 Cross-Role Design Consistency

**Shared patterns across all 5 roles:**

| Element | Specification |
|---|---|
| **Header height** | 52px, background `var(--color-bg-surface)`, bottom border 1px |
| **Sidebar width** | 240px (Manager/Superadmin), 60px rail (Ticketer/Cashier), none (Gateman) |
| **Page padding** | 24px horizontal, 24px vertical |
| **Card radius** | 8px |
| **Card padding** | 16px |
| **Card border** | 1px solid `rgba(255,255,255,0.06)` |
| **Card gap** | 12px |
| **Table row height** | 44px (compact) |
| **Button height** | 32px (sm), 36px (md), 40px (lg) |
| **Input height** | 36px |
| **Font sizes** | Same scale across all roles |
| **Status colors** | Same semantic colors (green/yellow/red) everywhere |
| **Transition timing** | 150ms ease-default for all interactive elements |
| **Focus ring** | 2px solid indigo-500 with 2px offset (`box-shadow: 0 0 0 2px var(--color-bg-base), 0 0 0 4px var(--color-accent)`) |
| **Loading states** | Skeleton shimmer (not spinners) for content, spinner only for inline actions |
| **Empty states** | Illustration + human-voiced message + CTA button |
| **Toast notifications** | Bottom-right, auto-dismiss 5s, slide-in from right |

**Responsive Breakpoints:**
```
--bp-sm:  640px   — Mobile (kiosk tablets in portrait)
--bp-md:  768px   — Tablet
--bp-lg:  1024px  — Small desktop / large tablet landscape
--bp-xl:  1280px  — Standard desktop
--bp-2xl: 1536px  — Large desktop / external monitor
```

---

### 4.8 Command Palette (All Roles)

Following the 2026 trend of Cmd+K command palettes (standard in Linear, spreading to all SaaS):

```
┌──────────────────────────────────────────────────────┐
│  🔍  Search trips, passengers, actions...            │
│                                                      │
│  Recent                                              │
│  ├── New Ticket                              ⌘N     │
│  ├── Search Passenger                         ⌘K     │
│  └── View Shift Summary                       ⌘D     │
│                                                      │
│  Actions                                             │
│  ├── Create Ticket                                    │
│  ├── Print Last Ticket                                │
│  ├── End Shift                                        │
│  └── Switch to Dark Mode                              │
│                                                      │
│  Navigation                                          │
│  ├── Go to Dashboard                                  │
│  ├── Go to Trip Schedule                              │
│  └── Go to Reports                                    │
└──────────────────────────────────────────────────────┘
```

**Specs:**
- Max-width: 560px, centered
- Background: `var(--color-bg-elevated)` with `var(--shadow-xl)`
- Border: 1px solid `var(--color-border-default)`
- Border-radius: `var(--radius-xl)` (12px)
- Input: 44px height, no border, larger font (16px)
- Results grouped with section headers (11px uppercase)
- Keyboard navigation: ↑↓ arrows, Enter to select, Esc to close

---

## 5. Summary of Key Takeaways

### What Makes a Dashboard "Premium" in 2026:

1. **Calm Design** — Hide everything non-essential. Whitespace is a functional tool.
2. **Structure felt, not seen** — Borders are softened, rounded, minimal. Background contrast does the separation.
3. **Don't compete for attention** — Navigation and chrome should recede. Content area dominates.
4. **Role-adaptive interfaces** — Different users see different default views, not just different permissions.
5. **Command palette (Cmd+K)** — Now a standard expectation, not a power-user feature.
6. **Progressive disclosure** — Show 5 common options, hide "Advanced" behind an expand.
7. **Dark mode by default** — Premium dashboards ship dark. Light mode as secondary.
8. **Warm dark grays** — Move away from cool blue-tinted darks toward warmer, less saturated neutrals.
9. **Inter Variable font** — The de facto standard for SaaS dashboards.
10. **Motion as information** — Subtle, purposeful animations (150-200ms). No gratuitous effects.

### Top Design Tokens to Implement First:

```css
/* The 10 tokens that will make the biggest visual impact */
--color-bg-base:        #0A0A0B;
--color-bg-surface:     #111113;
--color-bg-elevated:    #1A1A1D;
--color-text-primary:   #EAEAEA;
--color-text-secondary: #8B8D97;
--color-accent:         #6366F1;
--color-border-default: rgba(255, 255, 255, 0.06);
--radius-lg:            8px;
--font-sans:            'Inter', system-ui, sans-serif;
--space-4:              16px;
```

---

## 6. Research Sources & References

| Source | URL | What We Extracted |
|---|---|---|
| Linear App | linear.app | CSS variables, font loading (Inter Variable), gray scale, toast styling |
| Linear Design Refresh Blog | linear.app/now/behind-the-latest-design-refresh | Design philosophy: calm design, dimmer sidebar, warmer grays, structure felt not seen |
| Linear Design Tokens (FontOfWeb) | fontofweb.com/tokens/linear.app | 63+ brand colors extracted |
| Linear Design System (Refero) | styles.refero.design | Core palette: Void #08090A, Carbon #0F1011, plus full gray scale |
| Linear DesignLang | designlang.app/gallery/linear-app | DTCG tokens, component anatomy, motion system |
| Vercel Dashboard | vercel.com/dashboard | Login redirect, page structure, Geist font system |
| Vercel Geist | vercel.com/geist | Design system overview |
| Raycast | raycast.com | Landing page structure, dark theme, product demo hero |
| Cal.com | cal.com | Light theme landing, two-column hero, social proof |
| OmniRoute | omniroute.online | Developer tool landing patterns, dark theme, feature grid |
| Mintlify Design Blog | mintlify.com/blog/design-matters | CSS design tokens (c15t system), spacing/radius/shadow tokens |
| SaaSUI 7 Trends 2026 | saasui.design/blog/7-saas-ui-design-trends-2026 | Calm design, AI as infrastructure, command palettes, role-based UI, progressive disclosure, emotional design |
| Code Theorem Dashboard UX | codetheorem.co/blogs/saas-dashboard-ux | Dashboard UX best practices |
| SaaS Dashboard Search | muz.li, tailadmin.com, adminlte.io, wrappixel.com | Template patterns, card layouts, sidebar designs |
| Admin Panel Search | colorlib.com, dribbble.com, navbar.gallery | Sidebar navigation, dark admin templates |
| Bus Station UI Search | behance.net, dribbble.com, figma.com | Ticket management dashboard patterns, POS UI, bus booking UI |

### Screenshots Saved

- `/home/z/my-project/download/ref-linear.png` — Linear landing page
- `/home/z/my-project/download/ref-vercel.png` — Vercel landing page
- `/home/z/my-project/download/ref-raycast.png` — Raycast landing page
- `/home/z/my-project/download/ref-calcom.png` — Cal.com landing page