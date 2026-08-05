// knowledgeBaseNode.config.js
// Data-only definition of the Knowledge Base node. Per NODE-SPECS.md, the
// options list is a short hardcoded set of example KB names for this
// assessment (the same mechanism outputNode.config.js's outputType select
// already uses, just with different option values).

import { Position } from 'reactflow';

export const knowledgeBaseNodeConfig = {
  type: 'knowledgeBase',
  title: 'Knowledge Base',
  fields: [
    {
      key: 'knowledgeBase',
      label: 'Knowledge Base:',
      type: 'select',
      options: [
        { label: 'Product Docs', value: 'Product Docs' },
        { label: 'Support Tickets', value: 'Support Tickets' },
        { label: 'Internal Wiki', value: 'Internal Wiki' },
      ],
      defaultValue: 'Product Docs',
    },
    {
      key: 'topK',
      label: 'Top K:',
      type: 'number',
      defaultValue: 3,
    },
    {
      key: 'minRelevanceScore',
      label: 'Min Relevance Score:',
      type: 'number',
      defaultValue: 0,
    },
  ],
  handles: [
    { name: 'query', type: 'target', position: Position.Left },
    { name: 'results', type: 'source', position: Position.Right },
    { name: 'sources', type: 'source', position: Position.Right },
  ],
};
