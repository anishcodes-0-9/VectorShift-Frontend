# VectorShift Design Audit & Proposed Design System

- **Status:** Product-design decision, precedes the RFC/blueprint implementation work
- **Purpose:** ground the styling milestones (RFC-node-architecture.md §2 non-goal, blueprint §6 "styling convention") in the real VectorShift brand instead of a generic guess
- **No code in this document.**

## 0. Method and limitations

VectorShift's actual marketing site (`vectorshift.ai`) ships its design tokens as literal CSS custom properties inside `<style>` tags, plus concrete component rules (buttons, inputs, focus states) — so this audit is built by fetching the real HTML/CSS (`curl` with a browser user-agent, then grepping the extracted stylesheet for `--variables`, hex colors, `border-radius`, `box-shadow`, `transition`, font stacks, spacing, and `@keyframes`) rather than describing a screenshot from memory. Every value quoted below is copied verbatim from their shipped CSS, not estimated.

**Two real gaps, stated up front rather than papered over:**
- The authenticated product canvas (`/platform/pipeline` — presumably where their actual ReactFlow-style node editor lives) returned `403` to both the fetch tool and a direct `curl` with a realistic user-agent — it's behind bot protection separate from the rest of the marketing site. **The node/canvas-specific UI (node cards, handles, minimap chrome, toolbar) is not directly observed.** §1.9 below is a reasoned inference from the rest of the system, flagged as such, not a fact.
- No browser/screenshot tool was available this session, so this is a CSS-token audit, not a pixel-level visual audit. High confidence on colors, type, spacing, and motion (read straight out of their stylesheet); lower confidence on exact compositional layout, since that requires seeing rendered pixels.

## 1. Findings by Category

### 1. Typography
Three-font system, loaded from Google Fonts:
- **Sans (`--sans`):** `'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif` — weights 200/300/400/500/600 loaded. Used for UI text, nav, body copy. Notably caps out at 600 — no bold/black weight anywhere in the loaded set. Restrained, never shouty.
- **Serif (`--serif`):** `'Newsreader', 'Times New Roman', Georgia, serif` — roman + italic, 400/500, loaded. This is the tell: a marketing/AI-infra company deliberately importing an editorial serif (Newsreader is a Google Fonts "high-contrast, literary" typeface) for display headlines, not just a sans stack. Signals an editorial/publishing tone, not a typical SaaS-dashboard tone.
- **Mono (`--mono`):** `'JetBrains Mono', ui-monospace, Menlo, monospace` — 400/500, for technical/code-adjacent text.
- **Scale:** fine-grained, non-round steps observed across two pages: `9, 10, 10.5, 11, 12, 12.5, 13, 13.5, 14, 14.5, 15.5, 16, 17, 19, 20, 22, 24, 26, 28px`. The half-pixel steps (`10.5`, `12.5`, `13.5`, `14.5`, `15.5`) indicate a fluid/interpolated scale tuned per breakpoint, not a fixed 4-step type ramp.
- **Tracking:** display/headline sizes get tight negative letter-spacing (`-0.02em` to `-0.04em`, typical of large grotesque/serif display type). Small caps and "eyebrow" labels get wide positive tracking (`0.14em`–`0.22em`) — classic editorial "kicker label" convention.
- **Line-height:** tight (`0.95`–`1.2`) on display sizes, relaxed (`1.5`–`1.7`) on body copy — real hierarchy discipline, not accidental.

### 2. Color Palette
Full token set, defined as CSS variables identically on every page checked:
```
--bg:        #FFFEFB      (page background — warm off-white, not pure white)
--bg-alt:    #FCF9F0
--paper:     #FBF9F4
--ink:       #0F131A      (primary text — near-black, not pure #000)
--ink-soft:  #20242C
--muted:     #54585F      (secondary text)
--dim:       #8B867D      (tertiary text — see accessibility note, §14)
--rule:      #D9D3C5      (dividers — warm beige, not cool gray)
--rule-dk:   #BFB7A4
--accent:    #5B4824      (a muted olive-brown/gold — not blue, not purple)
--accent-soft: rgba(91,72,36,0.08)
```
Plus a component-level red used only for error/destructive states: base `#C0392B`, seen as a focus-ring (`rgba(192,57,43,0.08)`) mirroring the ink focus-ring exactly — same pattern, swapped color. A brighter gold, `#C5A562`, appears specifically as the *hover* fill for the primary black button (see §7) — a deliberate two-tone accent system (muted brown for text/links, brighter gold for interactive hover feedback), not a single flat brand color.

A handful of other hex values (`#06080b`, `#10003`, `#14245a`, `#8A8E96`, `#8A5B55`, `#E3B4AE`, `#FBEAE8`) appear in the raw markup but never as defined `--variables` — most likely from embedded brand-mark/illustration SVGs rather than active UI tokens. Flagged as unconfirmed, not included in the token set below.

**Net effect: zero blue, zero purple, zero gradient, zero glassmorphism.** This is a deliberate rejection of the generic "AI SaaS" cool-toned look in favor of a warm, paper-and-ink, editorial palette.

### 3. Layout System
Vertical modular grid with very generous whitespace:
- `.section { padding: 96px 0; }` to `140px 0` on larger breakpoints — section rhythm, not a compact dashboard density.
- `.section-inner { max-width: 1320px; margin: 0 auto; padding: 0 64px; }` — a wide but bounded content column.
- Prose/text blocks get their own tighter max-widths (`440px`–`720px`, one even at `18ch`) — a magazine-column convention: constrain line length for readability rather than letting text stretch full-width.
- Numbered feature sections (`01`, `02`, `03`, `04`) instead of icon-badge cards — an editorial "figure numbering" habit.

### 4. Cards
Minimal, text-forward — not boxed. No visible card container with its own background/border/shadow; sections are separated by whitespace and a single `1px solid var(--rule)` bottom border per section, plus the numbered-badge convention from §3. This is a much flatter, more restrained approach than a typical "shadow-and-rounded-corner card grid" SaaS marketing page.

### 5. Shadows
Essentially none used for elevation/depth. The *only* `box-shadow` rules found on either page, across the entire stylesheet:
```
box-shadow: 0 0 0 3px rgba(15,19,26,0.08)   /* default focus ring */
box-shadow: 0 0 0 3px rgba(192,57,43,0.08)  /* error focus ring */
```
Shadows exist exclusively as a focus-state accessibility signal — never as decorative depth. This is a disciplined, deliberate choice worth preserving.

### 6. Radius
Near-zero. Two values found in the entire stylesheet: `border-radius: 2px` (rectangular elements) and `border-radius: 50%` (circular elements — avatars/dots only). No `8px`/`12px`/`16px` "friendly rounded SaaS" radius anywhere. Sharp corners are core to the identity, not an oversight.

### 7. Buttons
Concrete rule, extracted verbatim (`.demo-form-submit`):
```
background: #0F131A; color: #FFFEFB; border: 1px solid #0F131A;
font-size: 14px; font-weight: 500; letter-spacing: 0.02em;
padding: 14px 20px; transition: background .2s, color .2s, border-color .2s;
```
Hover: `background/border-color → #C5A562; color → #0F131A` — the button *inverts and shifts to gold* on hover, not a simple opacity/darken. A separate nav-level CTA hover pattern inverts to plain ink-on-cream (`background: var(--ink); color: var(--bg)`) — so there are two hover conventions: nav/text CTAs invert tonally; the primary filled button shifts to the brighter accent gold specifically.

### 8. Inputs
Also extracted verbatim:
```
background: #FFFFFF; border: 1px solid #BFB7A4; padding: 11px 13px;
font-size: 14.5px; color: #0F131A; transition: border-color .15s, box-shadow .15s;
```
Note inputs get *pure white* (`#FFFFFF`), not the warm cream page background — a deliberate contrast so form fields visually "lift" off the paper. Focus: `border-color → #0F131A; box-shadow → 0 0 0 3px rgba(15,19,26,0.08)` (no default blue browser outline — replaced consistently). Error state swaps the same ring pattern to the red token. Textareas: `resize: vertical; min-height: 64px`.

### 9. ReactFlow / Node-Editor Styling — **inferred, not observed**
No access to the actual canvas UI (see §0). Reasoning from the rest of the system: if the product canvas follows the marketing site's discipline (sharp 2px corners, no drop shadows except focus rings, warm cream/ink palette, restrained gold accent), node cards would likely be flat, ink-bordered rectangles on a cream canvas background rather than the default ReactFlow look (white cards, gray canvas, soft drop shadows, blue selection halos). This is the single biggest actual unknown in this audit — flagged for the reviewer, not asserted as fact.

### 10. Icons
Sparse on the marketing site — it's typography/photography-driven, not icon-driven. The few inline SVGs found are simple `viewBox="0 0 24 24"` line marks with `aria-hidden="true"` correctly set on decorative icons (good accessibility hygiene) and occasional `fill="none"` (stroke-based, not filled). Not enough real evidence to claim a strong icon system exists yet — this is an area VectorShift's own marketing site under-specifies, so the assessment has real latitude here.

### 11. Animations
More sophisticated than expected for a marketing site. Named keyframes include `kenburns` (slow pan/zoom on hero imagery — a documentary-film technique), `draw-rule` (animates a horizontal rule being "drawn" — ties directly to the editorial rule-line motif in §3/§4), `hero-in`, `doc-in`, `highlight-in`, `cite-in`, `anno-in` (annotation reveal — consistent with the "paper/citation" metaphor), `cursor-trace` (an animated cursor for product demos), and `pulse` (a status/live indicator). Two easing curves are used throughout: `cubic-bezier(.16,1,.3,1)` — the same "premium ease-out" curve widely used by Linear/Vercel/Stripe for high-craft reveal animations — and a snappier `cubic-bezier(.4,0,.4,1)` for smaller UI transitions. **This confirms VectorShift's real motion language is already at the craft level the assessment is asking to emulate from Linear/Vercel** — it just isn't blue/rounded/dark-mode to get there.

### 12. Hover Interactions
Consistent, fast, color-only transitions (`0.15s`–`0.3s`, never a layout shift or scale-transform on hover). Links and nav items shift to the accent brown; the primary button shifts to accent gold; icon-only buttons (e.g. a modal close `×`) shift from muted gray to ink. No hover elevation (shadow-on-hover), consistent with §5's "shadows are focus-only" rule.

### 13. Spacing Scale
Roughly a 4px base grid with deliberate hand-tuned exceptions for optical correctness: observed `gap`/padding values include `4, 6, 8, 10, 11, 12, 13, 14, 16, 24, 32, 36, 40, 56, 64, 80, 96px`. The presence of `6, 10, 11, 13, 14` alongside clean multiples of 4 indicates a team optically adjusting spacing by eye in places, not rigidly snapping everything to a grid tool would output.

### 14. Accessibility
Computed actual WCAG contrast ratios from the token hex values against `--bg` (#FFFEFB):
| Pair | Ratio | Verdict |
|---|---|---|
| `--ink` on `--bg` | 18.45:1 | Passes AAA easily |
| `--muted` on `--bg` | 7.09:1 | Passes AAA |
| `--dim` on `--bg` | **3.59:1** | **Fails AA for normal text** (needs 4.5:1) — only safe for large/decorative text, not body copy |
| `--accent` on `--bg` | 8.69:1 | Passes AAA — safe for text use |
| `#C5A562` gold behind ink text (button hover) | 7.92:1 | Passes AAA |
| `--rule-dk` border on white input | 2.00:1 | Under WCAG's 3:1 non-text-contrast guideline for UI boundaries — a real minor gap, compensated somewhat by the ink focus ring on interaction |
| Error red `#C0392B` on `--bg` | 5.39:1 | Passes AA |

Also checked: **zero `prefers-reduced-motion` handling anywhere in the stylesheet** — a real, concrete gap, given how much motion the site uses (§11). Decorative icons correctly use `aria-hidden="true"` where found. Net: mostly accessible-by-accident-of-good-taste (high-contrast ink-on-cream), with two concrete gaps worth *improving on* rather than copying: `--dim`'s contrast floor, and missing reduced-motion support.

### 15. Overall Visual Language
Not a typical "AI SaaS" look at all. It reads as **editorial/publishing-house** — warm paper tones, an editorial serif for display type, sharp corners, shadow used only for focus accessibility (never decoration), restrained muted-gold accenting instead of a bright brand-blue, and motion that borrows the same premium easing curves as Linear/Vercel/Stripe but applies them to documentary-style pans and "drawing a rule" reveals instead of glossy card hovers. It is quietly sophisticated — closer in spirit to Arc/Raycast's *tone* of restraint than to their *specific* dark, rounded, glassy visual vocabulary.

---

## 2. Should we follow VectorShift's real design language (A), or build something Linear/Vercel/Raycast/Figma-inspired instead (B)?

**Recommendation: A — closely follow VectorShift's actual design language, using the real tokens above, not a guessed one.**

The framing in the original question assumed a tradeoff between "VectorShift's (presumably plain/corporate) look" and "something more polished, modern, Linear/Vercel/Raycast/Figma-inspired." That tradeoff doesn't actually exist once you look at the real tokens: VectorShift's *actual* shipped design — warm ink-on-paper palette, disciplined shadow-only-for-focus rule, sharp 2px corners, a fine-tuned type scale, and the *same* premium `cubic-bezier(.16,1,.3,1)` easing Linear and Vercel use for their own reveal animations — is already operating at that craft tier. It's just a warmer, more editorial visual identity than those four references, not a less sophisticated one.

Building "a modern workflow builder inspired by Linear/Vercel/Raycast/Figma" from scratch, without grounding it in VectorShift's real tokens, would most likely land on the generic version of that aesthetic — dark or near-black UI, blue/purple accent, heavily rounded corners, drop-shadow card elevation — which is precisely the "generic AI SaaS" look VectorShift's real site has deliberately moved away from. For a *VectorShift* technical assessment specifically, submitting that generic look would read as "didn't look at the actual product," while submitting the real ink/paper/gold system reads as "did the homework" — a much stronger signal in a take-home evaluation context.

The one place B's references genuinely earn a mention is §9/§10: VectorShift's *own* marketing site doesn't tell us anything about node-editor-specific interaction conventions (drag handles, connection-line hover states, node-selection affordances) or icon systems, because that UI wasn't accessible. For exactly those two gaps — and only those two — borrowing well-understood, accessible conventions from mature node-based/dev tools (Figma's selection/connection affordances, Linear's icon sizing and weight discipline) is the right move, applied *within* VectorShift's real color/type/radius/shadow system, not as a separate competing visual identity.

## 3. Proposed Design System for This Assessment

All values below are either lifted directly from VectorShift's real tokens (§1) or, where explicitly marked, a reasoned addition to fill the two observed gaps (canvas-specific component styling, icon system) — never an unrelated import.

### Colors
```
bg          #FFFEFB   canvas/page background
bg-alt      #FCF9F0   alternating section / minimap background
paper       #FBF9F4   node card fill  ← proposed use, no direct precedent, chosen to match §1's "paper" surface family rather than defaulting to white
surface     #FFFFFF   input fields, anything that should visually "lift" off paper (per §8)
ink         #0F131A   primary text, node headers, selected/active borders
ink-soft    #20242C   secondary structural text
muted       #54585F   secondary/help text (7.09:1 — safe for body use)
dim         #8B867D   tertiary/disabled text ONLY at large sizes — never body copy (§14 contrast gap)
rule        #D9D3C5   default dividers, unselected node borders
rule-dk     #BFB7A4   input borders, emphasized dividers
accent      #5B4824   links, focus text, primary icon color
accent-soft rgba(91,72,36,0.08)   subtle accent backgrounds (e.g. hovered toolbar chip)
accent-hi   #C5A562   hover fill for primary buttons/active states — never a resting-state color
danger      #C0392B   destructive actions, validation errors, delete-node affordance
danger-soft rgba(192,57,43,0.08)  error focus rings
```
Zero blue, zero purple as base UI colors — reserved entirely (per §2) for anything that must visually read as "this is not VectorShift's own chrome" (there is nothing in this assessment that needs that, so in practice: none).

### Typography
- Sans (`Inter Tight`) for all UI chrome: node labels, field labels, toolbar, buttons — weights 400/500/600 only, never above 600.
- Serif (`Newsreader`) reserved for one deliberate moment only: the app's own page title/hero, if any — not used inside nodes or forms, to avoid diluting its "this is a considered, editorial choice" impact.
- Mono (`JetBrains Mono`) for anything technical: node IDs, variable tokens like `{{input}}` inside the text node, the backend response payload display.
- Base UI size 14px (matches their real input font-size of 14.5px, rounded to a cleaner value for a smaller component set); labels/eyebrows at 11–12px with `0.14em` tracking, uppercase, matching their kicker-label convention.
- Tight tracking (`-0.02em`) on anything larger than 20px; default tracking below that.

### Radius
`2px` everywhere rectangular (nodes, buttons, inputs, toolbar chips), `50%` only for circular affordances (drag handles, connection dots, avatar-style icons if any). No 8/12/16px radius anywhere — this is the single most identity-defining, easy-to-get-wrong rule, so it's called out on its own.

### Shadows
None for elevation, ever. The only two shadow rules in the system:
```
focus (default): 0 0 0 3px rgba(15,19,26,0.08)
focus (error):   0 0 0 3px rgba(192,57,43,0.08)
```
A selected/active node gets an ink-colored **border** change (per §7's button pattern: shift the border/background, don't add a shadow), not a drop shadow — keeps nodes flat and paper-like even when selected.

### Spacing
Base unit 4px. Scale: `4, 8, 12, 16, 24, 32, 48, 64px` for this assessment's smaller surface area — a simplified version of their real `4…96px` range, since a node-editor toolbar and node cards don't need their marketing site's largest section-level gaps. Deliberately not perfectly rigid: component-internal padding (node header padding, field row padding) may take the odd hand-tuned value (e.g. `10px`/`14px`) where 4px multiples look visually loose, mirroring §13's finding that VectorShift itself deviates from strict grid snapping for optical correctness.

### Motion
Two easing curves, matching §11 exactly:
```
ease-reveal:  cubic-bezier(.16,1,.3,1)   — node add/remove, panel open/close
ease-ui:      cubic-bezier(.4,0,.4,1)    — hover color shifts, focus ring appear
```
Durations: `150ms` for focus/border transitions, `200ms` for color/background hovers — both lifted verbatim from §7/§8. **Explicit improvement over the source (§14 gap):** wrap all of the above in a `prefers-reduced-motion: reduce` guard that collapses transitions to near-instant — something VectorShift's own site doesn't do, worth doing better here.

### Border System
`1px solid` throughout — no 2px/heavy borders anywhere in the source system, so none introduced here either. Three border colors only: `rule` (default/unselected), `ink` (selected/focused), `danger` (error/invalid) — exactly mirroring the input focus/error pattern from §8, reused for node selection state instead of introducing a fourth, unrelated "selected" color.

### Icons
**The one category with no real precedent to follow (§10)** — proposed rather than observed: simple 20px stroke-based line icons (`fill="none"`, ~1.5px stroke), monochrome using `ink` at rest and `accent` on hover/active, matching the few real icon instances found (`viewBox 0 0 24 24`, stroke-based, `aria-hidden` on decorative use). No filled/duotone icon style — would clash with the system's flat, line-driven identity everywhere else.

### Component Styling Rules
- **Buttons:** filled `ink`-on-`bg` primary button, hover shifts fill+border to `accent-hi` gold with `ink` text (§7, verbatim) — never a gradient, never a shadow-on-hover.
- **Inputs:** `surface` (white) fill, `rule-dk` border, `ink` focus border + focus-ring shadow, `danger` swap for the error state — verbatim from §8.
- **Node cards:** `paper` fill, `rule` border at rest, `ink` border when selected, `2px` radius, header in `ink` sans-medium, body fields using the input rules above, handles as small `ink`-stroked circles (`50%` radius) that fill solid `accent` on hover/connect-drag.
- **Toolbar chips (draggable nodes):** same flat/bordered convention as buttons, `rule` border at rest, `accent-soft` background on hover/drag-start — not the current dark-navy filled chip (`#1C2536`) from `draggableNode.js`, which doesn't match any token in this system and should be retired along with the styling pass.
- **Hover discipline:** color/background/border-color only, `150–200ms`, no scale/translate transforms, no shadow-on-hover — consistent everywhere, per §12.

This system is deliberately small — it covers exactly what this assessment's node editor needs, built from real VectorShift tokens plus the two explicitly-flagged, minimally-scoped additions (node/canvas surface colors, icon system) where no real precedent existed to follow.
