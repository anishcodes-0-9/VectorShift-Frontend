// llmNode.config.js
// Data-only definition of the LLM node. No fields; "This is a LLM." moves from a
// hardcoded body div to config.description. Handle order (system, then prompt)
// matches llmNode.js's existing top: 33.3%/66.7% placement via NodeHandles'
// auto-spacing default — no explicit offsets needed.

import { Position } from 'reactflow';

export const llmNodeConfig = {
  type: 'llm',
  title: 'LLM',
  description: 'This is a LLM.',
  fields: [],
  handles: [
    { name: 'system', type: 'target', position: Position.Left },
    { name: 'prompt', type: 'target', position: Position.Left },
    { name: 'response', type: 'source', position: Position.Right },
  ],
};
