// textNode.config.js
// Data-only definition of the Text node, plus the small pure helpers that turn
// parsed {{variable}} names into HandleConfig entries. The dynamic, per-render
// handle list itself is NOT computed here — that needs React-lifecycle-scoped
// memoization (see ../TextNode.js) to stay referentially stable across
// keystrokes that don't change the variable set, and this config object is a
// shared singleton reused by every Text node instance, so it can't hold any
// one instance's state. `handles` below is just a valid, self-consistent
// fallback (the static output handle) for a NodeConfig used outside that
// wrapper — the real render path always overrides it.

import { Position } from 'reactflow';

export const DEFAULT_TEXT = '{{input}}';

const OUTPUT_HANDLE = { name: 'output', type: 'source', position: Position.Right };

export const buildTextHandles = (variableNames) => [
  ...variableNames.map((name) => ({ name, type: 'target' })),
  OUTPUT_HANDLE,
];

export const textNodeConfig = {
  type: 'text',
  title: 'Text',
  icon: 'type',
  fields: [
    {
      key: 'text',
      label: 'Text:',
      type: 'text',
      defaultValue: DEFAULT_TEXT,
    },
  ],
  handles: buildTextHandles([]),
};
