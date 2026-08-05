# Five New Node Specifications — Simplified to Fit the Existing Architecture

- **Status:** Revision of the previous version of this document, re-evaluated against a stricter constraint
- **Constraint driving this revision:** the existing `BaseNode`/`NodeHandles`/`NodeField` architecture is not expanded unless the assessment itself requires it. No list/repeatable fields, no conditional field visibility, no nested configuration, no dynamic labels. Every field is `text` / `select` / `textarea` / `number` — the four types already in the RFC. The goal shifts from "cover as much of VectorShift's real surface area as possible" to "prove the abstraction is flexible using the smallest, most reviewable design per node."
- **No code in this document.**

## What changed from the previous version, and why

The previous version was optimized for fidelity to VectorShift's real product and, in three of five nodes, that fidelity required real product features (an editable list of branches, loader-type-dependent fields, a headers list) that only exist as repeatable or conditional configuration in the real thing. Under the new constraint, those three are simplified — not by inventing something unrelated, but by shipping the smallest real *slice* of the same VectorShift capability that fits the existing four field types and a static (or already-approved, function-of-data) handle list. One node, Condition, loses real capability in the process (arbitrary user-defined branches become a fixed true/false branch) — that tradeoff is stated plainly in §6 rather than hidden.

Net result: **all five nodes now fit entirely inside the architecture as already approved in the RFC and blueprint.** Nothing here requires a new `FieldConfig` type, a new `HandleConfig` shape, or a new sub-component.

---

## 1. Knowledge Base Node — unchanged, already fit

| | |
|---|---|
| **Purpose** | Run a semantic search against a VectorShift Knowledge Base and return the top-matching passages — the retrieval half of RAG, the pattern behind VectorShift's own "Document Search Assistant" example pipeline. |
| **Inputs** | 1 target handle — `query`. |
| **Outputs** | 2 source handles — `results` (retrieved passage text) and `sources` (source document names, for citation display). |
| **Fields** | `knowledgeBase` (**select** — a short hardcoded list of example KB names for this assessment, the same mechanism `OutputNode`'s existing `outputType` select already uses, just with different option values), `topK` (**number**, default `3`), `minRelevanceScore` (**number**, `0`–`1`). |
| **Icon** | Open-book / stacked-document glyph with a small magnifying glass. |
| **Why it belongs in VectorShift** | RAG retrieval is VectorShift's most heavily documented product pillar (five real Knowledge Base node variants exist in their docs); a pipeline builder without a retrieval node can't express their flagship use case. |
| **Why it demonstrates BaseNode's flexibility** | Nothing here is a new mechanism — `select` and `number` already exist. What's new is the *combination*: two number fields together (a first for this node set) and **two source handles that each carry a genuinely different kind of data** (passage text vs. a citation list), a fan-out shape the current 4 nodes never show. |
| **Fit check** | Full fit, no simplification needed — this node's real-world shape was already small enough to land inside the existing four field types and a static handle list. |

---

## 2. Condition Node — simplified from arbitrary branches to a fixed true/false branch

| | |
|---|---|
| **Purpose** | Route execution down one of two paths based on comparing an upstream value against a single condition. A deliberately reduced version of VectorShift's real Condition node, which supports an arbitrary, user-editable number of branches. |
| **Inputs** | 1 target handle — `input` (the value being tested). |
| **Outputs** | 2 **fixed** source handles — `true`, `false`. Per VectorShift's real node, these carry no data of their own — they're pure control-flow routing; whatever's already flowing through the pipeline continues down whichever handle is active. |
| **Fields** | `operator` (**select**: Equals / Contains / Greater Than / Less Than), `compareValue` (**text** — the value to compare `input` against). |
| **Icon** | A simple two-way branch/fork glyph. |
| **Why it belongs in VectorShift** | "Logic" is a real, separately documented category in VectorShift's builder. Without any branching node, the current 4-node set is strictly linear — it can express a chain, never a decision. A fixed true/false branch is the smallest possible unit of that capability. |
| **Why it demonstrates BaseNode's flexibility** | Exactly one `select` + one `text` field, and a **static** two-entry `handles` array — no dynamic handles, no new field type. It demonstrates that a node whose two outputs carry *no data* (pure routing) is just as easy to express in this architecture as a node whose outputs carry real data (Knowledge Base, above) — same `NodeConfig` shape, same `NodeHandles` component, the difference is entirely in what the pipeline's execution logic does with the edges, not in how the node is configured or rendered. |
| **Fit check** | Fits entirely — see §6 for what was traded away to get here. |

---

## 3. URL Loader Node — simplified from five loader types to one

| | |
|---|---|
| **Purpose** | Ingest a web page's content into the pipeline as text. One specific, real loader type from VectorShift's documented "Data Loaders" family (URL / Wikipedia Query / YouTube URL / Arxiv Query / Repository URL) — the other four are the same shape with different backend fetch logic, not a different frontend node design, so shipping one proves the pattern without needing the loader-type-dependent fields the full five-type version would require. |
| **Inputs** | None — self-contained, like the existing `InputNode`. |
| **Outputs** | 1 source handle — `content`. |
| **Fields** | `url` (**text** — the page to load), `recursive` (**select**: Yes / No, default No — "scrape sub-pages," reframed from a checkbox to a select so it stays inside the four existing field types), `rescrapeFrequency` (**select**: Never / Hourly / Daily / Weekly / Monthly, default Never). |
| **Icon** | Globe-with-link glyph. |
| **Why it belongs in VectorShift** | "URL" is one of VectorShift's five real, named Data Loader types — not a generic placeholder. |
| **Why it demonstrates BaseNode's flexibility** | Three fields, two of them `select`, always rendered, never conditional on each other — a node that's entirely "flat" configuration, in deliberate contrast to Condition's control-flow-only handles and Knowledge Base's dual-typed outputs. Zero target handles (matching `InputNode`'s existing shape) shows the same shell handles "purely generative, nothing wired in" nodes identically to how it already handles `InputNode`. |
| **Fit check** | Full fit. The simplification (one loader type instead of five) removes the *only* thing that would have required conditional field visibility — everything else about the node was already inside the existing model. |

---

## 4. Slack Message Node — unchanged, already fit

| | |
|---|---|
| **Purpose** | Post a message to a Slack channel — the terminal "action" step of an automation. VectorShift's own marketing copy uses exactly this as its example of what an action node does. |
| **Inputs** | 1 target handle — `message`. |
| **Outputs** | **None.** Mirrors VectorShift's real Knowledge Base Loader node, which their own docs describe as having no node outputs — some real nodes exist purely for a side effect. |
| **Fields** | `channel` (**text**, e.g. `#general`), `fallbackMessage` (**text** — a literal message, always rendered, used only at execution time if the `message` handle isn't wired; this is exactly the same "typed default value that a connection can override" pattern the existing `InputNode`/`OutputNode` already use for their own fields — nothing conditional about the *field's visibility*, only about which value execution picks). |
| **Icon** | Chat-bubble/hash glyph, drawn in this app's own flat line style rather than importing Slack's brand mark. |
| **Why it belongs in VectorShift** | Integrations are a whole separate, heavily marketed third of VectorShift's real product beyond pipeline logic and knowledge retrieval — without an action node, the set can "figure something out" but never "do something about it." |
| **Why it demonstrates BaseNode's flexibility** | The one node in the set with **zero rendered output handles at all** — proving the shell degrades cleanly to "nothing on this side" without needing a special case, the mirror image of `TextNode`/`InputNode` having zero *target* handles today. |
| **Fit check** | Full fit, unchanged from the previous version — this node never needed a list field or conditional visibility; the earlier draft's `connection` field is simplified out here since a hardcoded, always-visible `channel` text field already demonstrates the point without implying a credential-picker mechanism this assessment has no backend for. |

---

## 5. Custom API Request Node — simplified: headers become a textarea, auth fields always shown

| | |
|---|---|
| **Purpose** | Call an external REST endpoint from a pipeline — VectorShift's own documented generic escape hatch, filed under their real Data Loaders tab, for whenever a pre-built integration doesn't exist. |
| **Inputs** | 1 target handle — `body` (optional request payload). |
| **Outputs** | 1 source handle — `response`. |
| **Fields** | `method` (**select**: GET / POST / PUT / PATCH / DELETE), `url` (**text**), `headers` (**textarea** — raw `key: value` lines or a JSON blob, typed as plain text rather than a structured list; this is the one deliberate downgrade in this node — see §6), `authType` (**select**: None / Bearer Token / API Key), `authValue` (**text** — always rendered, ignored at execution time if `authType` is None, exactly the same "always-visible, contextually-ignored" pattern used for Slack's `fallbackMessage` above). |
| **Icon** | `</>` code-bracket glyph — the "raw/developer" affordance, distinct from Slack's consumer-integration glyph. |
| **Why it belongs in VectorShift** | Directly documented as VectorShift's own generic REST node, and consistent with their separate Python SDK — the developer-extensibility pillar, expressed inside the visual builder. |
| **Why it demonstrates BaseNode's flexibility** | The only node in the set that uses **all four** existing field types across one config (`select` ×2, `text` ×2, `textarea` ×1), proving the same small type set composes into a genuinely more complex node without needing a fifth type. |
| **Fit check** | Fits, with one honest downgrade: see §6. |

---

## 6. Where full fidelity to VectorShift's real product genuinely can't be simplified further

Two places in this revision, both stated here rather than left implicit:

**Condition node — arbitrary user-defined branches.** VectorShift's real Condition node lets a user click "+ Add Path" repeatedly, each new path carrying its own operator/value pair, plus a fixed "else." A per-branch condition spec is, by definition, a list of records — there's no way to offer *arbitrary* branch count without either a repeatable field (disallowed here) or a fixed maximum with several branches' fields shown/hidden based on a count (conditional visibility, also disallowed). This isn't a simplification that stayed faithful to the real feature; it's a genuine capability reduction, traded deliberately for architectural elegance: a fixed true/false branch demonstrates the same "control-flow-only, no data on the edges" concept the real node has, at a fraction of the configuration surface. If arbitrary branching is ever wanted for real, it will need the list-field type this revision is explicitly avoiding — that's a future, separate architectural decision, not something to smuggle in now.

**Custom API node — structured headers.** A raw-text `headers` field is honest and functional (most HTTP clients accept `key: value`-per-line or a JSON object as a string, parsed at execution time), but it loses the structured editing UX (add/remove one header at a time, no risk of a malformed blob) that a real key-value list would give. This one is a smaller, more comfortable trade than Condition's — a textarea is a completely reasonable way to enter headers for a technical/developer-facing node — but it's still worth naming as a real UX downgrade versus a purpose-built list field, not pretending the two are equivalent.

Both are one-way doors only in the sense that *this assessment* won't build the list-field mechanism to reopen them — nothing about `BaseNode`'s `{ id, data, config }` contract would need to change if a future body of work decided the tradeoff was worth revisiting.

---

## Sources

- [Knowledge Base Loader Node - VectorShift](https://docs.vectorshift.ai/platform/pipelines/knowledge/knowledge-base-loader)
- [Condition Node - Introduction - VectorShift](https://docs.vectorshift.ai/platform/pipelines/logic/condition)
- [Document Search Assistant | VectorShift](https://docs.vectorshift.ai/vectorshift/example-pipelines/document-search-assistant)
- [Pipeline Node - VectorShift](https://docs.vectorshift.ai/platform/pipelines/general/pipeline)
- [Output Node - VectorShift](https://docs.vectorshift.ai/platform/pipelines/general/output)
- [VectorShift Platform Pipeline](https://vectorshift.ai/platform/pipeline)
- [Notion - VectorShift integration details](https://vectorshift.ai/integration-details/notion)
- [Hubspot - VectorShift integration details](https://vectorshift.ai/integration-details/hubspot)
- [Slack - VectorShift integration details](https://vectorshift.ai/integration-details/slack)
- [vectorshift · PyPI (developer SDK)](https://pypi.org/project/vectorshift/)
- [VectorShift API Integrations - Pipedream](https://pipedream.com/apps/vectorshift)
