# Resumatch — Complete UX / UI / Accessibility / Responsive Audit

**Auditor roles:** Principal UX Designer · Senior Product Designer · Design System Architect · Frontend Architect · Accessibility Expert · Senior QA
**Scope:** Entire frontend (`src/`, `index.html`, `tokens.css`, `globals.css`), all pages, layout, UI primitives, feature components, landing, hooks, store.
**Stack:** Vite 8 · React 19 · TypeScript (strict) · Tailwind v4 · Zustand · React Query · React Router 6 · lucide-react · DOMPurify. No CSS-in-JS lib; styling is CSS custom properties + global utility classes + heavy inline `style` objects.
**Baseline:** `tsc --noEmit` passes clean. No ESLint configured.

> **Guiding constraint honored throughout:** preserve the existing "Portfolio" identity — dark-first, green accent (`#3ECC90`), Clash Display / Satoshi / JetBrains Mono, pill buttons, `translateY` lift hovers, `cardIn`/`pageIn`/`shimmer`/`pulse-dot` animations. No redesign. Every recommendation is the least-invasive option that improves usability, accessibility, responsiveness, or consistency.

---

# Executive Summary

| Dimension | Score | One-line verdict |
|---|---|---|
| **UX** | **7.5 / 10** | Strong, opinionated flows (guarded generation, live import stepper, inline delete-confirm). Friction is in discoverability and a few dead-feeling interactions. |
| **UI** | **8 / 10** | Cohesive, distinctive, well-tokenized visual language. Loses points on token redundancy and inline-style sprawl. |
| **Accessibility** | **5 / 10** | Good intentions (skip-link, `aria-label`s, `role="status"`, reduced-motion). Undermined by non-dialog modals, AA contrast failures on "faint" text, unlabeled landing inputs, and missing disclosure ARIA. |
| **Responsive** | **6.5 / 10** | Mobile (<768) and desktop (≥1024) are handled deliberately. The **768–1024 tablet band is the weak zone**, plus a toast/tab-bar collision on phones. |
| **Consistency** | **7 / 10** | One design system, applied with discipline — but redundant radius tokens, three "primary button" implementations, and divergent page paddings. |
| **Polish / Microinteractions** | **7 / 10** | Lovely entrance & loading animations. Two notable gaps: dead hover on history icon-buttons and a press-state that mirrors hover. |
| **Animation health** | **9 / 10** | Animations are clean, GPU-friendly (`transform`/`opacity`), and reduced-motion aware. Nothing is broken; preserve all. |

**Headline:** This is a well-built, identity-rich product, not a rough draft. The highest-leverage work is **accessibility remediation** (modals, contrast, form labels) and **closing the tablet responsive gap** — all achievable without touching the visual identity.

---

# CRITICAL ISSUES (ranked)

### C1 — Modals are not accessible dialogs
- **Problem:** [`Modal.tsx`](src/components/ui/Modal.tsx) renders a `<div>` overlay with no `role="dialog"`, no `aria-modal`, no `aria-labelledby`. It never moves focus into the dialog on open, does not trap focus (Tab walks into the page behind the overlay), and does not restore focus to the trigger on close. The title is a `<span>`, not a labelled heading.
- **Why it matters:** WCAG 2.2 — **4.1.2 Name/Role/Value**, **2.4.3 Focus Order**, **2.4.7 Focus Visible**. Screen-reader users aren't told a dialog opened; keyboard users lose their place and can interact with hidden background content.
- **Impact:** High — affects every preview/view flow.
- **Files / components:** `Modal.tsx`; consumers: `ProfilePage`, `HistoryPage`, `TemplateGallery`.
- **Fix:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at a real heading id; focus the close button (or panel) on open; trap Tab/Shift+Tab within the panel; restore focus to the previously-focused element on close. Keep the existing `slideUp`/`fadeIn` animations untouched.
- **Complexity:** Medium.

### C2 — Toast notifications collide with the mobile tab bar
- **Problem:** [`Toast.tsx`](src/components/ui/Toast.tsx) pins the toast stack to `bottom: var(--space-6)` (24px). On phones the [`MobileTabBar`](src/components/layout/MobileTabBar.tsx) is `position: fixed; bottom: 0; height: 56px` + safe-area. Toasts render **on top of / overlapping** the primary navigation.
- **Why it matters:** The most important transient feedback in the app (saved / generated / deleted / errors) lands on top of the nav on every mobile device — obscuring both the message and the tab bar.
- **Impact:** High — 100% of mobile sessions.
- **Files:** `Toast.tsx`, `globals.css`.
- **Fix:** On the mobile breakpoint, lift the toast container above the tab bar: `bottom: calc(var(--mobile-tabbar-height) + var(--space-3) + env(safe-area-inset-bottom))` and constrain width to the viewport. Desktop position unchanged.
- **Complexity:** Low.

---

# HIGH PRIORITY ISSUES

### H1 — "Faint" text fails WCAG AA contrast (both themes); "muted" is borderline
- **Problem (measured):**
  - Dark `--color-text-faint #4A5E55` on bg = **2.72:1** (needs 4.5). Light `#94A3B8` on bg = **2.45:1**.
  - Dark `--color-text-muted #6B8078` on bg = **4.48:1** (fractionally under; lower on card surfaces).
- **Why it matters:** WCAG 2.2 **1.4.3 Contrast (Minimum)**. Faint is used for *informational* text — helper text, character counts, timestamps, the loading step counter, import hints, footer.
- **Impact:** Legibility for low-vision users and anyone on a glare-prone screen.
- **Files:** [`tokens.css`](src/styles/tokens.css).
- **Fix (hue-preserving, verified):** dark faint → `#7A8D83` (5.37:1 / 4.52:1 on cards), dark muted → `#82948B` (5.90 / 4.97), light faint → `#637088` (4.77 / 5.00). Light muted retained. Hierarchy (text > muted > faint) preserved; green-grey hue retained.
- **Complexity:** Low (token-only) — with deliberate, documented identity trade-off (secondary text becomes slightly lighter in dark mode).

### H2 — History icon-buttons have a declared hover transition but no hover style
- **Problem:** `.history-action-btn` (view / download / delete in [`HistoryCard.tsx`](src/components/features/HistoryCard.tsx)) sets `transition: background, color` inline but **no `:hover` rule exists** in `globals.css`. These icon-only controls give zero feedback on hover.
- **Why it matters:** Icon-only actions already lean on tooltips for discoverability; with no hover affordance they feel inert/broken, inconsistent with `.preview-action-btn`, `.sidebar-nav-item`, `.resume-preview-btn`, which all have hover states.
- **Impact:** Medium-High — the History page's only actions.
- **Files:** `globals.css`.
- **Fix:** Add `.history-action-btn:hover` (subtle `--color-primary-highlight` bg + `--color-primary` color; delete variant tints toward `--color-error`). Matches existing icon-button language.
- **Complexity:** Low.

### H3 — "Advanced Settings" disclosure: no ARIA + height-clipping risk
- **Problem:** [`ProfilePage.tsx`](src/pages/ProfilePage.tsx) accordion toggle has no `aria-expanded`/`aria-controls`; the panel animates via `max-height: 0 ↔ 400px`. On narrow screens (fields stack to one column) and with larger system font sizes, content can exceed 400px and be clipped/unreachable.
- **Why it matters:** WCAG **4.1.2** (state not exposed) and **1.4.10 Reflow** / content cut-off.
- **Impact:** Medium-High.
- **Files:** `ProfilePage.tsx`.
- **Fix:** Add `aria-expanded`/`aria-controls` + panel `id` and `role="region"`; raise the collapsed→open `max-height` to a safe ceiling (e.g. 640px) or animate a `grid-template-rows: 0fr→1fr` wrapper. Preserve the chevron rotation.
- **Complexity:** Low-Medium.

### H4 — Landing access inputs are unlabeled and don't announce errors
- **Problem:** In [`AccessSection.tsx`](src/components/landing/AccessSection.tsx) the email and password `<input>`s have placeholders but **no `<label>`/`aria-label`**, no `aria-invalid`, and error text isn't programmatically associated or announced (`role="alert"` absent).
- **Why it matters:** WCAG **3.3.2 Labels or Instructions**, **4.1.2**, **4.1.3 Status Messages**. First-touch conversion surface.
- **Impact:** Medium-High (a11y on the entry funnel).
- **Files:** `AccessSection.tsx`.
- **Fix:** Add `aria-label` (or visually-hidden `<label>`), wire `aria-invalid` + `aria-describedby` to the error node, and give error nodes `role="alert"`. Keep all inline focus styling.
- **Complexity:** Low.

### H5 — Profile completeness bar is invisible to assistive tech
- **Problem:** The progress bar in `ProfilePage` is two `<div>`s; the percentage is conveyed only visually + a sighted text line.
- **Why it matters:** WCAG **4.1.2** — no `role="progressbar"`/`aria-valuenow`.
- **Impact:** Medium.
- **Files:** `ProfilePage.tsx`.
- **Fix:** Add `role="progressbar"` with `aria-valuenow/min/max` and an `aria-label`.
- **Complexity:** Low.

### H6 — Tablet band (768–1024px) is the responsive weak zone (Generator)
- **Problem:** `.generator-page` switches to single-column only at `max-width: 767px`. At 768–~900px the layout stays two-column with a **fixed 420px** left rail (`padding: var(--space-10)` = 40px) and a `--space-10` form, leaving the preview pane very narrow and cramped. Global `overflow-x: hidden` masks any true overflow rather than preventing it.
- **Why it matters:** iPad portrait (768/820) and small laptops land here; the preview — the payoff — is squeezed.
- **Impact:** Medium-High on tablets/foldables.
- **Files:** `globals.css` (`.gen-left`, media queries).
- **Fix:** Add an intermediate rule (≤1024px) that narrows the rail and its padding, or stacks one column below ~900px. No identity change.
- **Complexity:** Low-Medium.

---

# MEDIUM PRIORITY ISSUES

### M1 — `ShortcutsPopover` lacks disclosure semantics & keyboard dismissal
[`ShortcutsPopover.tsx`](src/components/features/ShortcutsPopover.tsx): toggle button has no `aria-expanded`/`aria-haspopup`; popover can't be closed with Escape and doesn't manage focus. **Fix:** add `aria-expanded`/`aria-haspopup="dialog"`/`aria-controls`, close on Escape, return focus to the trigger. Complexity: Low.

### M2 — `Button` has no default `type`, risking accidental form submits
[`Button.tsx`](src/components/ui/Button.tsx) doesn't default `type`, so inside any `<form>` it is `submit`. Today the Profile form sets explicit types, but this is a latent regression trap. **Fix:** default `type="button"`; callers opt into `type="submit"`. Complexity: Low.

### M3 — Three divergent "primary button" implementations
`.btn-primary-variant` (`color: var(--color-bg)`), `.preview-download-btn` / `.preview-download-btn-hero` (`color: #fff`), and ad-hoc inline buttons in `AccessSection` (`#fff`) differ in text color, radius, padding, and hover lift. **Why:** consistency + theming (hardcoded `#fff` ignores light theme intent). **Fix:** align on token-driven foreground; longer-term, route through `Button`. Complexity: Medium (kept low-risk for now — document + align colors).

### M4 — Redundant / incomplete design tokens
`--radius-sm` == `--radius-md` (8px) and `--radius-lg` == `--radius-xl` (16px); the type scale jumps `1rem → clamp(1.25–1.5) → clamp(2–3)` with no mid/2xl steps, so components hardcode sizes (`1.1rem`, `1.15rem`, `1.3rem`, `0.7rem`, `0.6rem`). **Fix:** treat as documentation now; collapse/extend tokens in a dedicated pass to avoid churn. Complexity: Medium.

### M5 — Inconsistent page chrome
Page paddings diverge (History `--space-8` vs Profile `--space-6`); max-widths differ (History `720px`, Profile `--content-narrow 640px`); in-app `h1`s use inline `font-weight: 500` while global `h1` is `600`. **Fix:** standardize page container padding/width and heading weight. Complexity: Low.

### M6 — `scroll-padding-top` shorter than the fixed nav
`globals.css` sets `scroll-padding-top: var(--space-16)` (64px) but the nav is `--topbar-height` (72px), so anchor jumps (`#how-it-works`, `#access`) hide the target heading ~8px under the nav. **Fix:** set scroll-padding to `var(--topbar-height)` (+ a little). Complexity: Trivial.

### M7 — Pressed state mirrors hover (no tactile "press")
`.btn-base:active { transform: translateY(-2px) }` equals the hover lift, so a click produces no distinct feedback. **Fix (optional, conservative):** give active a settle (e.g. `translateY(0)`), preserving the hover lift. Flagged, not forced — it changes feel. Complexity: Trivial.

### M8 — Mobile tab-bar badge uses a magic offset
`right: calc(50% - 20px)` positions the History count badge; brittle across label widths. **Fix:** anchor relative to the icon. Complexity: Low.

---

# LOW PRIORITY IMPROVEMENTS

- **L1 — Inline-style sprawl:** large `style={{…}}` objects across pages/landing hurt maintainability and prevent media-query/`:hover`/`:focus` styling without JS. Gradually migrate hot spots to utility classes. (Maintainability.)
- **L2 — JS-driven hover** (theme toggle, landing nav/CTA, AccessSection cards) won't respect `prefers-reduced-motion` and has no touch fallback (harmless — they have `aria-label`s; transform-only). Consider CSS hover where practical.
- **L3 — `EmptyState`/`Modal` headings** use weight 500 vs global heading scale — fold into M5 standardization.
- **L4 — Sidebar `v1.0` footer & "RM" logo** have no programmatic relationship to app version/home link; minor.
- **L5 — `formatTimestamp`** uses raw `toLocaleString()` (verbose, locale-variable) in the preview footer while history uses friendly `timeAgo`. Inconsistent time formatting.
- **L6 — Idle/empty CTA discoverability:** Generator idle state explains the flow well, but the keyboard shortcut (⌘↵) is only surfaced in the popover. Minor onboarding nudge opportunity.

---

# Deliverable sections

## 1. UX Audit
Flows are coherent and thoughtfully guarded: Generator blocks generation until profile is complete (`ProfileGuard` → Profile), the resume import shows a **truthful live stepper** + post-run audit summary (excellent trust-building), and delete uses inline confirm (no modal interruption). Friction: tablet preview squeeze (H6), inert history hovers (H2), anchor-scroll hiding (M6), and discoverability of shortcuts/CTA (L6). No dead-ends or broken flows found.

## 2. Responsive Audit (320 → 1920)
- **320–767 (phones):** Deliberate single-column rules for generator, profile rows, preview toolbar, landing grids; safe-area handled on the tab bar. **Defect:** toast/tab-bar collision (C2). 320px width is tight on History (`--space-8` side padding) — fold into M5.
- **768–1024 (tablets/foldables):** **Weakest band** — Generator two-column with fixed 420px rail (H6).
- **1280–1920 (desktop):** Content is width-capped (`--content-*`, max-widths) and centered — scales cleanly; no overflow.
- Global `overflow-x: hidden` is a safety net that can *mask* overflow — fixes target the cause, not the symptom.

## 3. Accessibility Report (WCAG 2.2 AA)
Present: skip-link, semantic landmarks (`banner`/`complementary`/`main`/`nav`), `aria-label`s on icon controls, `role="status"` toasts (`aria-live="polite"`), `:focus-visible` ring, `prefers-reduced-motion` reset, decorative icons `aria-hidden`. Gaps: dialog semantics (C1), contrast (H1), form labels/announcements (H4), disclosure state (H3, M1), progressbar (H5), default button type (M2). Fixing C1+H1+H3+H4+H5 moves the app from ~5 to ~8.5.

## 4. Design Consistency Report
One system, applied with discipline (spacing 4px scale, green accent, mono section-labels, pill radius). Inconsistencies: redundant radius tokens + sparse type scale (M4), three primary-button variants (M3), divergent page chrome (M5), heading weights (L3).

## 5. Component Consistency Report
Primitives (`Button`, `Input`, `Textarea`, `Badge`, `Skeleton`, `Card`, `EmptyState`) are clean and reused. But feature components frequently **re-implement** primitives inline (History action buttons, AccessSection inputs, HistoryPage download links) instead of composing `Button`/`Input`, causing the hover/contrast/type drift above. States covered well: loading (spinners), success (green confirm), error (banners), disabled. Missing: consistent hover on icon-buttons (H2), pressed feedback (M7).

## 6. Animation Preservation Report
**No animation is broken; none should be removed.** Catalogue (all `transform`/`opacity`, GPU-cheap, reduced-motion-guarded): `pageIn`, `cardIn`, `shimmer` (skeleton), `pulse-dot` (loading), `spin` (spinners), `slideUp`+`fadeIn` (modal), `toast-in`/`toast-out`, `float`, `authShake`, chevron rotation, completeness-bar width transition, theme-toggle rotate, card-hover lift, staggered `animationDelay`s. All fixes are designed to **work around** these (e.g., modal a11y adds behavior without touching keyframes).

## 7. Performance UX Report
React 19 + lazy-loaded `App` (auth-gated code splitting) — good. React Query disables refetch-on-focus and limits retries. Toasts capped at 3, history at 20. `previewHtml`/PDF via blob URLs (revoked on change). Observations: secondary-text contrast aside, no jank sources found; animations are compositor-friendly. Opportunities (low priority): memoize history list rows if it grows; the `backdrop-filter: blur(20px)` nav is fine at this scale. No hydration concerns (CSR SPA).

---

# Implementation order (Phase 12)
1. **C1** Modal a11y · 2. **C2** Toast vs tab-bar · 3. **H1** contrast tokens · 4. **H2** history hover · 5. **H3** accordion a11y+clipping · 6. **H4** landing labels · 7. **H5** progressbar · 8. **H6** tablet layout · 9. **M1** shortcuts popover · 10. **M2** button type · 11. **M5/M6** page chrome + scroll-padding.

Each lands as a small, logically-scoped commit. Validation after each: `tsc --noEmit`; full `build` at the end; manual regression review across the documented breakpoints. Identity, animations, and functionality preserved throughout.
