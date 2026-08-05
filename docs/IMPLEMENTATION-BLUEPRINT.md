# Implementation Blueprint: Config-Driven Node Architecture

- **Status:** Draft, implements the approved [RFC-node-architecture.md](./RFC-node-architecture.md)
- **Role:** Lead Staff Engineer sign-off document — no code in this document
- **Reads before this:** the RFC. This document assumes its §1–§9 as baseline and only restates what it changes.

---

## 1. RFC Validation

The RFC's core idea — config objects rendered through a shared `BaseNode` shell instead of one bespoke component per node type — holds up and should ship. Two gaps make it un-buildable as written, one planned file is unnecessary complexity, and one existing bug is about to become load-bearing. Findings below; each is resolved in §2–§4 rather than left open.

| # | Severity | Finding | Resolution |
|---|---|---|---|
| F1 | **Must fix** | `HandleConfig[]` as a purely static array can't express Part 3's requirement: a text node's handle *count* depends on parsing `{{variable}}` tokens out of live `data.text`. The RFC's config shape has no way to compute handles from data. | `NodeConfig.handles` becomes `HandleConfig[] \| ((data) => HandleConfig[])`. `BaseNode` resolves it with one line: call it if it's a function, else use it as-is. This keeps `BaseNode` itself free of business logic — the parsing rule lives inside `textNode.config.js`, colocated with the one node type that needs it, not in the shared shell. |
| F2 | **Must fix** | No slot exists for static descriptive body content. `LLMNode` currently renders a fixed sentence ("This is a LLM.") that is neither a field nor a handle. The field/handle-only model silently drops this on migration. | Add optional `description?: string` to `NodeConfig`, rendered by `BaseNode` between the header and the field list. This also resolves the RFC's open question about the `children` escape hatch — drop `children` from `BaseNode`'s API entirely. Every concrete case the escape hatch was hedging against turns out to be "static text," which `description` already covers; an escape hatch with zero real callers is a liability, not a feature. |
| F3 | **Simplify** | The planned `hooks/useNodeData.js` is unneeded. ReactFlow already passes `id` and `data` as props to every custom node component — there's nothing to re-select from the store for `data`. The *only* store dependency any node has is the `updateNodeField` action, which is a one-line, reference-stable selector (`state => state.updateNodeField`; Zustand action references don't change across renders). | Drop `hooks/useNodeData.js` from the folder plan. `BaseNode` calls `useStore(state => state.updateNodeField)` directly. One fewer file, one fewer layer of indirection to trace through. |
| F4 | **Hidden risk, now in scope** | `store.js`'s existing `updateNodeField` mutates the node object in place (`node.data = {...node.data, ...}` inside `.map()`) instead of returning a new node object. It happens to work today only because nothing calls it. This RFC is about to route *every* field edit, on *every* node, through this action — making the anti-pattern load-bearing instead of dormant. | Fix in the same commit that first wires this action up (Milestone 1): `.map(node => node.id === nodeId ? { ...node, data: { ...node.data, [fieldName]: fieldValue } } : node)`. Isolated, one-line, testable in isolation. |
| F5 | **Verify, no change needed** | Every keystroke in a field will now call `updateNodeField`, changing the `nodes` array reference. Confirm this doesn't cascade re-renders across unrelated nodes as node count grows. | Already safe: `ui.js`'s selector (`ui.js:25-33`) uses `shallow` and ReactFlow memoizes each custom node component by its own `data` prop reference. Calling it out explicitly so it's a conscious "verified," not an accident, since it's exactly the kind of thing that quietly rots as node count scales to the assessment's "100+ node types" framing. |
| F6 | **React/ReactFlow best practice** | Any list rendered from `config.fields` / `config.handles` must be keyed by `field.key` / `handle.name`, never by array index. Since handle *lists* are about to become variable-length (F1), index-keying is a correctness bug waiting to happen — React will misassign DOM/handle identity across a re-render that changes the list length. | Stated as a hard rule in §6, checked in every milestone's acceptance criteria. |
| F7 | **Consistency risk** | `NodeConfig.type` duplicates the key each config is registered under in `config/index.js`. Useful (mirrors today's `className={type}` pattern in `draggableNode.js`), but the two values must never drift, and nothing currently enforces that. | `config/index.js` asserts `config.type === registryKey` for every entry at module load — a same-file invariant check, not new node logic. Cheap insurance against copy-paste errors when config #5 through #9 get added later. |
| F8 | **Accepted scope boundary, not a defect** | `FieldConfig.type` covers `text \| select \| textarea \| number`. The 5 new nodes required by the assessment may eventually want more (checkbox, slider, file). | Explicitly not solved here (YAGNI) — `NodeField`'s type-switch grows by one case per new kind when a real node needs it. Flagging so a future reviewer doesn't mistake this for an oversight. |

**Verdict:** proceed with the RFC's shape, with F1/F2 folded into the public APIs below, F3 removing a file, F4 fixed inline in Milestone 1, and F6/F7 codified as standards in §6.

---

## 2. Final Folder Structure

```
frontend/src/
├── App.js                          UNCHANGED
├── index.js                        UNCHANGED
├── index.css                       UNCHANGED
├── store.js                        MODIFIED   (updateNodeField immutability fix — F4; no shape/signature change)
├── ui.js                           MODIFIED   (imports nodeTypes from ./nodes/config instead of ./nodes/*)
├── toolbar.js                      MODIFIED   (maps nodeConfigs instead of 4 hardcoded <DraggableNode> lines)
├── draggableNode.js                UNCHANGED
├── submit.js                       UNCHANGED  (Part 4 — separate effort, not touched by this blueprint)
└── nodes/
    ├── BaseNode.js                 NEW
    ├── NodeHandles.js              NEW
    ├── NodeField.js                NEW
    ├── config/
    │   ├── index.js                NEW        (registry: nodeTypes + nodeConfigs, F7 assertion)
    │   ├── inputNode.config.js     NEW
    │   ├── llmNode.config.js       NEW
    │   ├── outputNode.config.js    NEW
    │   └── textNode.config.js      NEW
    ├── inputNode.js                DELETED    (superseded by config/inputNode.config.js + BaseNode)
    ├── llmNode.js                  DELETED
    ├── outputNode.js               DELETED
    └── textNode.js                 DELETED
```

No `hooks/` directory (F3). The 5 additional node types required by Part 1 of the assessment land later as more `config/*.config.js` files plus one line each in `config/index.js` — out of scope for this migration blueprint, but this is the folder shape they'll drop into.

---

## 3. File-by-File Implementation Plan

No code below — shapes and responsibilities only, per the RFC's convention.

### `nodes/BaseNode.js` — NEW
- **Purpose:** the shared shell every node type renders through.
- **Responsibilities:** render container + header (`config.title`) + optional `config.description`; resolve `config.handles` (array or function, per F1) and pass to `NodeHandles`; map `config.fields` to `NodeField`, keyed by `field.key` (F6); select `updateNodeField` from the store (F3) and pass it down as each field's `onChange`.
- **Public API:** `BaseNode({ id, data, config })` — see RFC §5, minus `children` (F2).
- **Dependencies:** `zustand` (via `useStore`), `NodeHandles`, `NodeField`.
- **Expected size:** ~60–90 lines.
- **Why it exists:** single place that owns container/header markup, currently duplicated 4x (soon 9x).

### `nodes/NodeHandles.js` — NEW
- **Purpose:** render every `Handle` for a node from config, replacing hand-typed ids and hand-computed offsets.
- **Responsibilities:** for each `HandleConfig`, build id as `` `${id}-${handle.name}` ``, apply `position`/`offset`; call `useUpdateNodeInternals(id)` in a `useEffect` keyed on the resolved handle list's identity, so a data-driven handle-count change (Part 3, once built) always refreshes ReactFlow's internal cache — one place responsible, not per-node.
- **Public API:** `NodeHandles({ id, handles })` — `handles` is already-resolved (`BaseNode` calls the function form, if any, before passing down; `NodeHandles` only ever sees a plain array).
- **Dependencies:** `reactflow` (`Handle`, `Position`, `useUpdateNodeInternals`).
- **Expected size:** ~40–60 lines.
- **Why it exists:** removes `LLMNode`'s hand-computed `100/3`/`200/3` math and the copy-pasted `` `${id}-value` `` string pattern; centralizes the internals-refresh call this migration is explicitly trying not to make each node author remember.

### `nodes/NodeField.js` — NEW
- **Purpose:** render one field's label + control, fully controlled.
- **Responsibilities:** switch on `field.type` to render `text` / `select` / `textarea` / `number`; for `number`, coerce the DOM string value to `Number` before calling `onChange` (resolves RFC open question #2 — decided here, not deferred); no internal `useState`.
- **Public API:** `NodeField({ id, field, value, onChange })` — unchanged from RFC §5.
- **Dependencies:** none beyond React.
- **Expected size:** ~40–60 lines.
- **Why it exists:** direct replacement for the copy-pasted `useState` + `handleXChange` pattern present in all four existing nodes.

### `nodes/config/index.js` — NEW
- **Purpose:** single registration point read by both `ui.js` (needs `nodeTypes`) and `toolbar.js` (needs an orderable list for the draggable palette).
- **Responsibilities:** import all `*.config.js` files; export `nodeTypes` (`{ [config.type]: wrapperComponent }`, the exact shape `ReactFlow` expects — unchanged contract); export `nodeConfigs` (ordered array, drives the toolbar); assert `config.type === registryKey` for every entry (F7) at module load.
- **Public API:** `export const nodeTypes`, `export const nodeConfigs`.
- **Dependencies:** the four `*.config.js` files, `BaseNode`.
- **Expected size:** ~30–50 lines (mostly the four thin wrapper closures: `(props) => <BaseNode {...props} config={xConfig} />`).
- **Why it exists:** today, adding a node means editing `toolbar.js` and `ui.js` separately in two different shapes; this collapses both to reading the same list.

### `nodes/config/inputNode.config.js` — NEW
- **Purpose:** data-only definition of the Input node, reproducing current behavior exactly.
- **Responsibilities:** `type: 'customInput'`, `title: 'Input'`, `fields: [{key: 'inputName', ...}, {key: 'inputType', type: 'select', options: [...]}]`, `handles: [{name: 'value', type: 'source', position: Position.Right}]`.
- **Public API:** default export, a plain object — no functions, no JSX, no React import (enforced as a standard in §6).
- **Dependencies:** `reactflow`'s `Position` enum only.
- **Expected size:** ~15–25 lines.
- **Why it exists:** this file *is* "adding a node type" under the new model — the concrete proof the abstraction works.

### `nodes/config/outputNode.config.js` — NEW
- Same shape as above. One explicit decision flagged for reviewer sign-off in §8: the current "Image" option carries `value="File"` (pre-existing bug). This migration reproduces it byte-for-byte per the RFC's "behavior-preserving" migration principle; fixing it is a separate one-line follow-up commit, not folded in silently here.

### `nodes/config/textNode.config.js` — NEW
- **Purpose:** data-only definition of the Text node — the one config that exercises F1's function-form `handles`.
- **Responsibilities:** `handles` is written as a function of `data` (`(data) => [...]`) rather than a static array, even though today it still only ever returns the single static `output` handle — this migration does **not** implement Part 3's `{{variable}}` parsing (separate, later effort); it only makes sure the shape that feature needs already exists and is exercised by at least one real config, so Part 3 is additive later rather than a second architecture change.
- **Expected size:** ~15–20 lines.

### `store.js` — MODIFIED
- **Change:** `updateNodeField`'s body only, per F4. No signature change, no new exports, no change to any other action.
- **Expected diff:** ~3 lines.

### `ui.js` — MODIFIED
- **Change:** replace the four `import { XNode } from './nodes/xNode'` lines and the inline `nodeTypes` object with `import { nodeTypes } from './nodes/config'`.
- **Expected diff:** ~6 lines removed, 1 added.

### `toolbar.js` — MODIFIED
- **Change:** replace the four hardcoded `<DraggableNode type=... label=... />` lines with `nodeConfigs.map(cfg => <DraggableNode key={cfg.type} type={cfg.type} label={cfg.title} />)`.
- **Expected diff:** ~4 lines removed, 2 added.

---

## 4. Milestones

Seven milestones. Each compiles, is independently testable, and leaves the app fully working — no milestone depends on a later one.

### M1 — Fix `updateNodeField` immutability (F4)
- **Goal:** correct the store action before anything depends on it.
- **Files touched:** `store.js`.
- **Acceptance criteria:** action returns a new node object for the matched id; all other node references in the array stay identical (`===`) across the call.
- **Testing checklist:** unit-level only at this point — nothing calls this action yet, so the app's visible behavior is unchanged. Confirm `npm start` still runs and all 4 existing nodes behave exactly as before.
- **Rollback:** revert one file.
- **Risks:** none — dead code path until M3.

### M2 — Build shared primitives, unwired
- **Goal:** `BaseNode`, `NodeHandles`, `NodeField` exist and compile, imported by nothing yet.
- **Files touched:** `nodes/BaseNode.js`, `nodes/NodeHandles.js`, `nodes/NodeField.js` (new files only).
- **Acceptance criteria:** `npm run build` succeeds with these files present but unimported; no change to any running behavior (nothing references them yet).
- **Testing checklist:** build passes; existing 4 nodes and toolbar behave identically (nothing changed for them).
- **Rollback:** delete the 3 new files.
- **Risks:** low — isolated new files, zero blast radius.

### M3 — Migrate `InputNode`
- **Goal:** first real migration; proves the abstraction end-to-end on the simplest node.
- **Files touched:** new `nodes/config/inputNode.config.js`, new `nodes/config/index.js` (with just this one entry for now), `ui.js` (point `nodeTypes.customInput` at the new registry), delete `nodes/inputNode.js`.
- **Acceptance criteria:** Input node's visual output, field labels, default values, and handle id (`${id}-value`) are pixel/behavior-identical to before; field edits now persist to `node.data` (new, correct behavior — previously silently lost).
- **Testing checklist:** drag an Input node onto the canvas; edit Name and Type; drag a second Input node; confirm the two nodes' fields are independent; connect its source handle to something; delete and re-add.
- **Rollback:** revert the commit — `ui.js` and `toolbar.js` still reference the old 4-node setup for the other 3 types, only `customInput`'s entry changes.
- **Risks:** if `config/index.js` only exports one entry at this point, `nodeTypes` must still contain the other 3 old components — mixed old/new `nodeTypes` object is expected and fine for M3–M6, not a defect.

### M4 — Migrate `OutputNode`
- **Goal:** same pattern, second node type.
- **Files touched:** new `nodes/config/outputNode.config.js`, `nodes/config/index.js` (add entry), `ui.js` (unchanged further — already importing from registry), delete `nodes/outputNode.js`.
- **Acceptance criteria:** identical to M3's bar, applied to Output; "Image" option still carries `value="File"` (bug preserved, not fixed, per §3's flagged decision).
- **Testing checklist:** same as M3, plus: connect an Input node's source handle to an Output node's target handle and confirm the edge renders correctly.
- **Rollback:** revert the commit.
- **Risks:** none beyond M3's.

### M5 — Migrate `TextNode`
- **Goal:** exercise F1's function-form `handles` for the first time (still returning a static single handle — see §3).
- **Files touched:** new `nodes/config/textNode.config.js`, `nodes/config/index.js` (add entry), delete `nodes/textNode.js`.
- **Acceptance criteria:** identical visual/behavioral bar; `NodeHandles` correctly calls the function form and renders the one `output` handle exactly as the static form would have.
- **Testing checklist:** same connection tests as M3/M4; specifically verify no console warnings from `useUpdateNodeInternals` firing unnecessarily (the function should return a referentially-stable-enough result that the effect doesn't loop — see rollback note).
- **Rollback:** revert the commit.
- **Risks:** **the one real risk in this milestone.** A function-form `handles` that returns a brand-new array literal every render will change identity on every render, which could cause `NodeHandles`' effect to fire every render instead of only when the handle set actually changes. Mitigate by having `textNode.config.js`'s function return a module-level constant array when the inputs haven't changed (for now, it always has one fixed handle, so this is trivially satisfiable — but write the test for it now, because Part 3 will make this a real dynamic function, and the discipline should already be in place).

### M6 — Migrate `LLMNode`
- **Goal:** last of the 4 existing nodes; exercises `description` (F2) and multi-handle `offset` positioning (replaces `100/3` math).
- **Files touched:** new `nodes/config/llmNode.config.js`, `nodes/config/index.js` (add entry), delete `nodes/llmNode.js`.
- **Acceptance criteria:** "This is a LLM." renders via `config.description`, not a hardcoded body div; both target handles (`system`, `prompt`) render at the same visual offsets as today's `100/3`/`200/3`; response handle unchanged.
- **Testing checklist:** same connection tests as prior milestones; specifically drag edges into both target handles simultaneously and confirm they don't overlap or misposition relative to today's layout.
- **Rollback:** revert the commit.
- **Risks:** offset math translation — verify the new `offset` percentage produces the *same pixel position* as the old `top: ${100/3}%` inline style, not just "a reasonable-looking" position.

### M7 — Data-driven toolbar + final sweep
- **Goal:** `toolbar.js` reads from `nodeConfigs` instead of 4 hardcoded lines; confirm no dead code remains.
- **Files touched:** `toolbar.js`; audit-only pass over `nodes/` (no expected changes if M3–M6 each deleted their own old file).
- **Acceptance criteria:** toolbar renders all 4 draggable chips in the same order as before, from `nodeConfigs`; `git grep` for `from './nodes/inputNode'` (and the other 3) returns nothing; `nodes/` contains only the files listed as NEW in §2.
- **Testing checklist:** full regression pass — drag each of the 4 node types onto the canvas, connect a small chain (Input → LLM → Output, Text → LLM), edit fields on each, delete a node and confirm connected edges are removed, refresh the page (confirms nothing was relying on now-removed local component state to survive a re-render within a single session — note: full persistence across a page reload isn't in scope until Part 4's backend work).
- **Rollback:** revert the commit.
- **Risks:** low — this milestone is mostly deletion and a mechanical toolbar change; the risk is entirely "did an earlier milestone leave dead code," which the audit step directly checks for.

---

## 5. Testing Strategy

Applies the required categories per milestone. "N/A" means that category isn't touched by this blueprint at all (called out so it isn't mistaken for an oversight).

| Category | M1 | M2 | M3 | M4 | M5 | M6 | M7 |
|---|---|---|---|---|---|---|---|
| ReactFlow pan/zoom/select | — | — | ✓ unchanged | ✓ unchanged | ✓ unchanged | ✓ unchanged | ✓ full pass |
| Node creation (drag from toolbar) | — | — | ✓ Input only | ✓ +Output | ✓ +Text | ✓ +LLM | ✓ all 4 |
| Edge creation | — | — | ✓ Input's handle exists | ✓ Input→Output | ✓ Text's handle exists | ✓ LLM's 3 handles | ✓ full chain |
| Field editing → store sync | — | — | ✓ confirms F4 fix works | ✓ | ✓ | ✓ | ✓ |
| Toolbar | — | — | unchanged (mixed old/new) | unchanged | unchanged | unchanged | ✓ data-driven |
| Backend | N/A — out of scope for this blueprint (Part 4, separate effort) | | | | | | |
| Text node variables (`{{var}}`) | N/A — Part 3 feature, not built in this blueprint; M5 only proves the plumbing (function-form handles) is exercised | | | | | | |
| Dynamic handles | N/A for real dynamism (needs Part 3); M5/M6 verify the *mechanism* (`useUpdateNodeInternals` centralization) doesn't regress the static case | | | | | | |
| Styling | No visual diff expected at any milestone — this blueprint is a structural migration, not a styling pass (RFC §2 non-goal, reaffirmed here) | | | | | | |
| Regression (unrelated nodes) | — | — | ✓ Output/Text/LLM untouched | ✓ Input/Text/LLM untouched | ✓ Input/Output/LLM untouched | ✓ Input/Output/Text untouched | ✓ nothing left behind |

**Store synchronization check (run at M3 and re-confirm at M7):** open React DevTools, edit a field, confirm `node.data` in the store actually updates (this is the concrete, observable fix for the previously-dead `updateNodeField` path) — previously this would show the DOM input changing but `node.data` staying stale.

---

## 6. Engineering Standards

- **Component size:** `BaseNode` / `NodeHandles` / `NodeField` each target under ~120 lines. Exceeding ~150 in any of them is a signal something is being done in the wrong layer, not a reason to keep growing the file.
- **Hooks:** only React built-ins, `useStore`, and `useUpdateNodeInternals` are used in this migration. No new custom hook is introduced (F3) — if a later milestone seems to want one, that need must be argued explicitly, not defaulted into.
- **Naming:** config files end in `.config.js`; components are PascalCase; config object variables are camelCase and named `<type>NodeConfig`; a config's `type` value must exactly equal the key it's registered under (F7, enforced at module load).
- **State ownership:** field values live only in `node.data`, written only through `updateNodeField`. No node-facing component holds field state in local `useState` after this migration — controlled-only, data down.
- **Prop design:** every component takes flat, explicit props (`id`, `data`, `config`, or a single field's `field`/`value`/`onChange`); no prop spreading across component boundaries, no implicit context — a component's full contract is visible at its call site.
- **Styling:** continue the existing inline-style approach; centralize the shared container/header style object once, inside `BaseNode`, instead of repeating it per node. No new styling library introduced by this migration — that's a separate, later RFC.
- **File organization:** one node type = one config file; shared primitives live flat in `nodes/`, never inside `nodes/config/`.
- **Separation of concerns:** `BaseNode` = layout/shell only; `NodeField` = one field's render + control; `NodeHandles` = handle id/position/refresh only; config files are pure data plus, at most, one pure function (`handles`) — a config file never imports React or returns JSX.
- **Keying rule (F6):** any list rendered from config (`fields`, `handles`) is keyed by its semantic identity (`field.key`, `handle.name`), never by array index.
- **Immutability rule (F4):** every store action returns new objects/arrays for anything that changed; no store action mutates a node or edge object in place.

---

## 7. Commit Plan

One commit per milestone.

| Commit | Message | Summary | Files expected to change |
|---|---|---|---|
| 1 | `fix: make updateNodeField return a new node object` | Closes an immutability bug in the store action before it becomes load-bearing for every node's field edits. | `store.js` |
| 2 | `feat: add BaseNode, NodeHandles, NodeField shared primitives` | Introduces the shared shell and field/handle renderers behind the config-driven node model. Not yet wired into any node type. | `nodes/BaseNode.js`, `nodes/NodeHandles.js`, `nodes/NodeField.js` |
| 3 | `refactor: migrate InputNode to config-driven BaseNode` | First real migration; input node now defined as data, field edits now persist to the store. | `nodes/config/inputNode.config.js`, `nodes/config/index.js`, `ui.js`, delete `nodes/inputNode.js` |
| 4 | `refactor: migrate OutputNode to config-driven BaseNode` | Same pattern applied to the output node; pre-existing Image/File value mismatch intentionally preserved, not fixed here. | `nodes/config/outputNode.config.js`, `nodes/config/index.js`, delete `nodes/outputNode.js` |
| 5 | `refactor: migrate TextNode to config-driven BaseNode` | First config to use function-form `handles`, proving the shape Part 3 will need without implementing Part 3 itself. | `nodes/config/textNode.config.js`, `nodes/config/index.js`, delete `nodes/textNode.js` |
| 6 | `refactor: migrate LLMNode to config-driven BaseNode` | Last of the 4 existing nodes; introduces `description` for static body text and `offset`-based handle positioning. | `nodes/config/llmNode.config.js`, `nodes/config/index.js`, delete `nodes/llmNode.js` |
| 7 | `refactor: drive toolbar from nodeConfigs` | Toolbar palette generated from the same registry ReactFlow uses, closing the loop this migration started. | `toolbar.js` |

---

## 8. Final Readiness Review

Reviewing this as if it were another Staff Engineer's plan landing in my queue:

- **The two must-fix RFC gaps (F1, F2) are resolved, not deferred** — function-form `handles` and `description` are both in the public API in §3, and M5/M6 each exercise them at least once, so they're proven before Part 3 ever needs them for real.
- **One planned file was cut (F3)** rather than built and later found unused — fewer files to keep in sync is a better outcome than "we'll clean it up later."
- **One existing bug (F4) is fixed exactly where it starts mattering**, not bundled into an unrelated cleanup commit and not left for later.
- **Two decisions still need your explicit sign-off before M1 starts, both flagged rather than silently decided:**
  1. §3/M4 — preserve `OutputNode`'s "Image" option carrying `value="File"` during migration, with the actual fix as a separate one-line follow-up commit. Confirm this sequencing is what you want, versus fixing it inline in M4.
  2. §3 `NodeField` — numeric fields coerce to `Number` before `onChange` fires (RFC's open question #2, decided here rather than left open). Confirm this default is acceptable.
- **Everything else in this blueprint is either mechanical (delete a file, add a registry entry) or has an explicit test in §5** — no milestone leaves the app in a broken or partially-working state, and every milestone's rollback is "revert one commit."

Once the two items above are confirmed, Milestone 1 can start.
