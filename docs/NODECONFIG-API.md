# The Frozen `NodeConfig` Interface

- **Status:** Public API freeze — this is the contract every node config (the 4 existing + 5 from NODE-SPECS.md) will be written against. Implementation should not begin until this is signed off.
- **Method:** drafted against every real requirement raised so far — the RFC's F1/F2 fixes, the blueprint's F3–F8 findings, and all 9 nodes' actual field/handle needs from NODE-SPECS.md — then cut back property-by-property in §2, keeping only what a real node in this set actually uses or what a near-term future node would plausibly need.
- **No code in this document** — the shapes below are interface notation (matching the style already used in the RFC and blueprint), not implementation.

---

## §1. Draft Interface — every candidate property

Everything on the table before the cut, organized by the categories requested: required/optional/defaults, validation, icon, dimensions, handle metadata, field metadata.

```
NodeConfig {
  // required
  type: string
  title: string
  fields: FieldConfig[]
  handles: HandleConfig[] | (data) => HandleConfig[]

  // optional
  description?: string
  icon?: string
  width?: number
  minHeight?: number
}

FieldConfig {
  // required
  key: string
  label: string
  type: 'text' | 'select' | 'textarea' | 'number'

  // optional
  options?: { label: string, value: string }[]
  defaultValue?: string | number
}

HandleConfig {
  // required
  name: string
  type: 'source' | 'target'
  position: Position   // reactflow's Position enum

  // optional
  offset?: number   // 0–100, % along the edge
}
```

**Defaults, as drafted:**
- `description` → not rendered if omitted.
- `icon` → a generic fallback glyph if omitted.
- `width` → a shared constant (e.g. `200`) if omitted.
- `minHeight` → a shared constant (e.g. `80`) if omitted.
- `fields` → no default; always required, may be `[]`.
- `options` → required, non-empty, only when `type === 'select'`.
- `defaultValue` → `''` for text/textarea, `0` for number, `options[0].value` for select.
- `position` → no default; always required.
- `offset` → evenly distributed among same-side handles if omitted.

**Validation rules, as drafted:**
1. `config.type` must exactly equal the key it's registered under in `nodes/config/index.js` (F7).
2. `config.type` must be unique across the whole registry.
3. Every `field.key` must be unique within one node's `fields` array.
4. Every resolved `handle.name` must be unique within one node instance's resolved handle list.
5. `field.options` must be a non-empty array when `field.type === 'select'`; ignored otherwise.
6. If `handles` is a function, it must be pure and return a stable, same-length/same-order result for unchanged `data` (prevents the `useUpdateNodeInternals` re-render risk flagged in the blueprint's M5).
7. `width`/`minHeight`, if present, must be positive numbers.

---

## §2. Critical Review — what survives contact with the 9 real nodes

Testing every drafted property against the actual 4 existing nodes + the 5 nodes in NODE-SPECS.md — not "could this be useful someday," but "does a real node in this set need it, or is a near-term future node highly likely to."

| Property | Verdict | Reasoning |
|---|---|---|
| `type`, `title`, `fields`, `handles` | **Keep, required** | Every one of the 9 nodes needs all four — there is no node without a type/title, and even the field-less `LLMNode` still needs an (empty) `fields` array and a non-empty `handles` array. |
| `description` | **Keep, optional** | Looks like overhead for 8 of 9 nodes — but `LLMNode`'s real, existing body text ("This is a LLM.") needs *some* slot, and this is the one already agreed to in the blueprint (F2) specifically to avoid reopening the `children`-escape-hatch question. Cheap (one optional string, ignored when absent) and already justified by a real node's real, current content — not speculative. |
| `icon` | **Keep, optional** | Every one of the 9 nodes was given a specific icon in NODE-SPECS.md as part of the visual-identity work in DESIGN-AUDIT.md — this already cleared the "does this assessment need it" bar before this document existed. Kept minimal: a single string key resolved against one small shared icon lookup (plain data, not a component or SVG passed through config — keeps config files free of React, per the blueprint's separation-of-concerns rule). |
| `icon`'s fallback-glyph default | **Cut** | Inventing and maintaining a "default" glyph asset for the rare omitted case is pure overhead. **Simplified default: omitted `icon` renders no icon slot at all** — the header just shows the title, no reserved gap, no fallback asset to design or keep in sync. |
| `width` | **Cut entirely** | None of the 9 nodes need a non-default width. A single shared width constant lives in `BaseNode`'s own styling — it was never a per-node *decision* to begin with, so it never needed to be a config property. |
| `minHeight` | **Cut entirely** | Worse than unjustified — actively wrong. The current 4 nodes hardcode a fixed `height: 80`, which is a latent bug (content can already overflow it) that this migration should fix, not encode as a per-node config knob. Height should be **intrinsic** — the card grows to fit its header/description/fields/handles via normal block layout, the same way any well-built card component behaves. Nothing in this property earns a place in a "frozen public API." |
| `FieldConfig.key`, `label`, `type` | **Keep, required** | No node can omit any of these — `label` in particular stays a plain required string (dynamic/computed labels were explicitly ruled out in the prior round). |
| `FieldConfig.options` | **Keep, conditionally required** | Needed by every `select` field across all 9 nodes (`inputType`, `outputType`, `knowledgeBase`, `operator`, `recursive`, `rescrapeFrequency`, `method`, `authType`) — this is the single most-used non-text field shape in the whole set. |
| `FieldConfig.defaultValue` as a plain literal | **Insufficient as drafted — see below** | A flat `string \| number` default cannot express what `InputNode`/`OutputNode` **already do today**: `data?.inputName \|\| id.replace('customInput-', 'input_')` — the real default is *derived from the node's own id* (so two Input nodes on the same canvas default to `input_1`, `input_2`, not the same literal string twice). Freezing the interface without this would silently regress real, existing behavior the whole migration is supposed to preserve byte-for-byte. |
| — resolution | **Widen to `string \| number \| ((id: string) => string \| number)`** | Exactly the same "value or function-of-something" shape already approved for `handles` (RFC's F1) — not a new mechanism, a second use of one already-frozen pattern. Only `InputNode`'s and `OutputNode`'s configs will actually use the function form; every other field uses a plain literal. |
| `HandleConfig.name`, `type` | **Keep, required** | No handle can omit either. |
| `HandleConfig.position` as always-required | **Simplify to optional with a type-based default** | Every single handle across all 9 nodes follows the same rule with zero exceptions: `target` → `Position.Left`, `source` → `Position.Right`. Requiring every config to spell this out 100% of the time for a value that's 100% predictable from `type` is pure boilerplate. **New default: `position` defaults to `Left` for `target` / `Right` for `source`; only specified explicitly for the rare future node that genuinely needs a top/bottom handle.** |
| `HandleConfig.offset` | **Keep, optional — but its default absorbs almost all real usage** | `LLMNode`'s real, existing hand-computed `100/3` / `200/3` math is precisely "evenly space 2 handles on the same side" — and so is every other multi-handle-per-side case in the new node set (Knowledge Base's 2 source handles, Condition's 2 source handles). **Default: when `offset` is omitted, auto-distribute all handles sharing the same `(type, position)` pair evenly** (`100 × (i+1) / (N+1)` for handle `i` of `N` on that side — reproduces `LLMNode`'s exact current `33.3%`/`66.6%` placement with zero config). After this default, **none of the 9 nodes' configs need to set `offset` at all** — it stays in the interface only as an escape hatch for a future node wanting asymmetric spacing, which costs nothing to leave available. |
| A `min`/`max`/`step`/`pattern` validation property for `number` fields | **Rejected, not added** | Considered for `topK`/`minRelevanceScore` (Knowledge Base) — but no current node enforces bounds anywhere in the app today, and nothing in this assessment's grading requires it. Adding validation config for a constraint nothing currently checks is exactly the kind of speculative property this exercise exists to catch. If real bounds-checking is ever needed, it belongs in pipeline-execution validation, not the node's rendering config. |
| A `required?: boolean` field flag | **Rejected, not added** | No current node has an optional-vs-required field distinction — every field always renders, always has a usable default. Nothing to attach this property to. |

---

## §3. The Final Frozen Interface

```
NodeConfig {
  // required
  type: string                                   // must equal its key in the config registry (validated at load)
  title: string
  fields: FieldConfig[]                          // may be [] (e.g. LLMNode)
  handles: HandleConfig[] | (data) => HandleConfig[]

  // optional
  description?: string                           // omitted → no body text rendered
  icon?: string                                  // omitted → no icon slot rendered; a key into one shared icon lookup
}

FieldConfig {
  // required
  key: string                                    // property name inside node.data
  label: string
  type: 'text' | 'select' | 'textarea' | 'number'

  // optional
  options?: { label: string, value: string }[]   // required + non-empty iff type === 'select'
  defaultValue?: string | number | ((id: string) => string | number)
                                                  // omitted → '' (text/textarea), 0 (number), options[0].value (select)
}

HandleConfig {
  // required
  name: string                                   // handle id becomes `${nodeId}-${name}`
  type: 'source' | 'target'

  // optional
  position?: Position                            // omitted → Left if type is target, Right if type is source
  offset?: number                                // omitted → evenly auto-spaced among same (type, position) handles
}
```

**Validation rules (final):**
1. `config.type` must exactly equal its registry key (checked once, at module load, in `nodes/config/index.js`).
2. `config.type` must be unique across the registry.
3. `field.key` must be unique within a node's `fields`.
4. Resolved `handle.name` must be unique within one node instance's resolved handles.
5. `field.options` required + non-empty iff `field.type === 'select'`; otherwise absent/ignored.
6. A function-form `handles` (or `defaultValue`) must be pure and stable for unchanged inputs.

**What this freeze deliberately does not include, and why that's final, not an oversight:** per-node dimensions (height is intrinsic; width is one shared constant), an icon fallback asset (omission just means no icon), field-level validation bounds, and a required/optional field flag. Each was considered and rejected in §2 against the actual 9-node set, not skipped by omission.

This is the complete surface every node config in this assessment will be written against — 4 required + 2 optional properties on `NodeConfig`, 3 required + 2 optional on `FieldConfig`, 2 required + 2 optional on `HandleConfig`. Nothing here is speculative; every property traces to at least one real, named node from NODE-SPECS.md or a real, currently-existing behavior in `inputNode.js`/`outputNode.js`/`llmNode.js`.
