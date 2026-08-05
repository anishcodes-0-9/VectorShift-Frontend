# RFC: Config-Driven Node Architecture for the Pipeline Builder

- **Status:** Draft — for review, no code written against this yet
- **Author:** Claude (Staff Frontend Engineer role), for anish.krishnan@debutinfotech.com
- **Scope:** `frontend/src/nodes/*`, `frontend/src/toolbar.js`, `frontend/src/store.js` (field-update wiring only)
- **Out of scope:** backend contract, styling token system, Part 3 variable-parsing regex — referenced where they constrain this design, detailed elsewhere

## 1. Problem

The current 4 nodes (`InputNode`, `LLMNode`, `OutputNode`, `TextNode`) are each a standalone ~40-line component that independently re-implements: the container `div` + border styling, the header `<span>`, label/input rows, hand-typed handle ids (`` `${id}-value` ``), and — in `LLMNode` — hand-computed handle offsets (`100/3`, `200/3`). None of them write back to the Zustand store's `updateNodeField` action, so field edits live only in local `useState` and never reach `node.data`. The assessment asks for 5 more node types and implies the system should scale to "100+ node types." Copy-pasting the current pattern 5 more times multiplies the existing bugs and duplication instead of fixing them.

This RFC proposes replacing "one bespoke component per node type" with "one config object per node type, rendered through a shared shell." It covers component hierarchy, state flow, the public API of the three new shared primitives (`BaseNode`, `NodeHandles`, `NodeField`), and folder layout. **No implementation code — this is for architecture sign-off before anything is written.**

## 2. Goals / Non-Goals

**Goals**
- Adding a node type = writing a config object, not a component.
- Fix the dead `updateNodeField` path so field edits actually persist to `node.data` (this also unblocks Part 3, which needs to inspect a text node's *current* text to detect `{{variable}}` patterns from outside local state).
- Centralize the `useUpdateNodeInternals` call so dynamic handle counts (Part 3) can't be forgotten on a per-node basis.
- Preserve the existing 4 nodes' exact visual output and `nodeTypes` keys — this is a refactor, not a behavior change, until new nodes are added on top of it.

**Non-goals**
- Not introducing a new styling library or CSS framework (none exist in `package.json` today; not justified by this change alone).
- Not changing the drag-and-drop mechanism, the Zustand store's edge-connection logic, or `PipelineUI`'s ReactFlow wiring.
- Not solving the backend contract or the `{{variable}}`-to-handle regex here — this RFC only makes the node layer capable of supporting them.

## 3. Component Hierarchy

```
App
├── PipelineToolbar
│   └── DraggableNode  (unchanged)              × N, now mapped from a config list instead of hardcoded JSX
├── PipelineUI
│   └── ReactFlow
│       └── nodeTypes[type]                     one thin wrapper per node kind, registered exactly as today
│           └── BaseNode                        shared shell: container, header, layout
│               ├── NodeHandles                  renders all target/source Handles from config
│               └── NodeField × N                one per field in config.fields
└── SubmitButton
```

The key structural change is what sits *inside* each `nodeTypes` entry. Today `nodeTypes.llm` points at a fully hand-written `LLMNode` component. Under this proposal it points at a thin wrapper that pairs a static config object with `<BaseNode>`:

```
nodeTypes.llm  →  (props) => <BaseNode id={props.id} data={props.data} config={llmNodeConfig} />
```

`ReactFlow` itself never sees this distinction — it still receives a plain `{ [type]: Component }` map, so `ui.js` needs no changes beyond importing from a new location.

## 4. State Flow

Two layers exist today; only one of them currently works correctly.

1. **Zustand store (`store.js`)** — `nodes`, `edges`, and graph-level actions. This is the correct source of truth for anything that must survive a re-render, be read by a sibling node, or be serialized for Part 4's submit payload.
2. **Local `useState` inside each node** — `currName`, `outputType`, `currText`, etc. This is where field values actually live today. `updateNodeField` exists in the store but nothing calls it, so `node.data` is stale from the moment a user types anything.

**Proposed flow:** `NodeField` becomes fully controlled from `node.data`, with no local state of its own.

```
node.data[field.key] ?? field.defaultValue        (read)
        ↓ rendered as controlled input value
user types
        ↓ onChange
NodeField calls onFieldChange(field.key, newValue)
        ↓ bubbles to BaseNode
BaseNode calls store.updateNodeField(id, key, newValue)
        ↓
Zustand set() → node.data updated → ReactFlow re-renders node with new data
```

This closes the loop that's currently broken and makes `node.data` the single source of truth — a prerequisite for Part 3 (a text node must be able to inspect its *own current* text to find `{{var}}` tokens and add a handle per token) and for Part 4 (submit needs to read final field values out of the store, not out of DOM state trapped inside unmounted components).

**Dynamic handle counts** (Part 3): when `config.handles` (or a computed handle list derived from field data) changes length, ReactFlow's internal handle-position cache goes stale and edges render at the old position. `NodeHandles` owns a `useEffect` keyed on the handle list's identity that calls `useUpdateNodeInternals(id)` — one place responsible for this, instead of relying on every future node author to remember it.

## 5. Public APIs

Interfaces only — no implementations.

### `BaseNode`

```
BaseNode({
  id: string,          // ReactFlow node id, e.g. "llm-1"
  data: object,        // ReactFlow node.data
  config: NodeConfig,  // static per-type definition, see below
  children?: ReactNode // escape hatch, see §8
}) → JSX
```

`NodeConfig` shape:
```
{
  type: string,            // must match the key this node is registered under in nodeTypes
  title: string,           // header text, e.g. "LLM"
  fields: FieldConfig[],   // see NodeField
  handles: HandleConfig[], // see NodeHandles
  width?: number,          // default shared constant if omitted
  minHeight?: number,
}
```

Responsibilities: render the shared container + header, lay out `fields` and `handles` via `NodeField`/`NodeHandles`, wire `NodeField`'s change events to the store's `updateNodeField`. Owns no per-node-type business logic — it is purely a shell and a wiring point.

### `NodeHandles`

```
NodeHandles({
  id: string,             // node id, used to build handle ids as `${id}-${handle.name}`
  handles: HandleConfig[],
}) → JSX
```

`HandleConfig` shape:
```
{
  name: string,                    // e.g. "prompt" → handle id "llm-1-prompt"
  type: 'source' | 'target',
  position: Position,              // reactflow's Position enum
  offset?: number,                 // 0–100, % along the edge; replaces hand-typed 100/3 math
}
```

Responsibilities: derive each `Handle`'s `id` and position style from config instead of hand-typed strings/fractions, and call `useUpdateNodeInternals(id)` when the handle list's identity changes.

### `NodeField`

```
NodeField({
  id: string,                     // node id, for building input element ids/labels
  field: FieldConfig,
  value: string | number,         // resolved as data[field.key] ?? field.defaultValue, passed down by BaseNode
  onChange: (key: string, value) => void,
}) → JSX
```

`FieldConfig` shape:
```
{
  key: string,                          // property name inside node.data
  label: string,
  type: 'text' | 'select' | 'textarea' | 'number',
  options?: { label: string, value: string }[],  // required when type === 'select'
  defaultValue?: string | number,
}
```

Responsibilities: render the label + the correct control for `field.type`, fully controlled — no internal `useState`. This is the component that directly replaces the copy-pasted `useState` + `handleXChange` pattern in all four existing nodes.

## 6. Folder Structure

```
frontend/src/
  nodes/
    BaseNode.js
    NodeHandles.js
    NodeField.js
    config/
      inputNode.config.js
      llmNode.config.js
      outputNode.config.js
      textNode.config.js
      index.js          // exports { nodeTypes } for ui.js and { nodeConfigs } for toolbar.js
  hooks/
    useNodeData.js       // wraps the store selector + updateNodeField for a single node id
  store.js                // unchanged shape; updateNodeField now actually called
  toolbar.js              // maps over nodeConfigs instead of 4 hardcoded <DraggableNode> lines
  draggableNode.js        // unchanged — already the one genuinely reusable piece
  ui.js                   // unchanged beyond importing nodeTypes from ./nodes/config
```

`nodes/config/index.js` is the single registration point: adding node #5 means adding one file there and one line to that index — nothing in `ui.js`, `toolbar.js`, or `store.js` changes.

## 7. Migration Path (behavior-preserving)

Each existing node's config is written to reproduce its *current* fields, handles, labels, and default values exactly — including the pre-existing `OutputNode` bug where the "Image" option carries `value="File"` (called out here so it's a conscious decision to fix during migration, not folded in silently as an unrelated change). `nodeTypes` keys (`customInput`, `llm`, `customOutput`, `text`) are preserved so `store.js`, `ui.js`, and existing serialized pipelines (if any exist client-side) keep working unchanged. This lets the refactor land as its own milestone with a visual/functional diff of zero, before any new node types or styling work is added on top.

## 8. Rationale Summary

| Decision | Why |
|---|---|
| Config objects instead of per-type components | Adding node #9 (or #100) is a data change, not a code change — matches the assessment's explicit "think 100+ node types" framing. |
| `BaseNode` owns the container/header | Removes the 4×-duplicated `width:200,height:80,border:'1px solid black'` + header markup, currently identical in all four nodes. |
| `NodeField` fully controlled from `data`, no local `useState` | Fixes the dead `updateNodeField` action; without this, Part 3 (text node inspecting its own text) and Part 4 (submit reading final values) are both blocked. |
| `NodeHandles` centralizes id/position derivation + `useUpdateNodeInternals` | Removes hand-typed handle-id strings and the `100/3`-style pixel math in `LLMNode`; makes the ReactFlow internals refresh a property of the shared component, not something each node author must remember. |
| `nodeTypes`/`nodeConfigs` registered from one `index.js` | Toolbar and ReactFlow's node map both read from the same list, so the two can never drift out of sync (today, adding a node requires editing `toolbar.js` and `ui.js` separately, in two different shapes). |

## 9. Open Questions for Reviewer Sign-Off

1. **`children` escape hatch on `BaseNode`.** Proposed as an out for a future node that doesn't fit the field/handle model, but none of the current 4 or the 5 new ones are expected to need it. Recommend leaving it unused for now — flag here rather than deciding unilaterally, since an unused escape hatch that never gets exercised is a sign it shouldn't be part of the API yet.
2. **`type: 'number'` coercion.** Should `NodeField` parse numeric fields to `Number` before calling `onChange`, or hand back the raw string and let the config's consumer decide? Leaning toward coercing in `NodeField` since every current/planned field is string-valued and this only matters for future node types — flagging rather than assuming.
3. **Styling mechanism.** Not decided here since it's outside this RFC's scope, but `BaseNode`'s container/header markup is the single place a future shared styling pass (CSS module vs. inline constants) would attach — worth confirming that pass happens *after* this RFC's structural refactor lands, not interleaved with it, so each change is independently testable.

---
No implementation has been written against this document. Please confirm or push back on §5's three API shapes and §9's open questions before any code is generated.
