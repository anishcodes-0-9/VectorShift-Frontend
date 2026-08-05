// textNode.config.js
// Data-only definition of the Text node. `handles` is written in function form
// to exercise the shape Part 3's dynamic {{variable}} handles will need, even
// though it still only ever returns this one static handle today. The function
// returns the same module-level array on every call so NodeHandles' internals-
// refresh effect doesn't fire on every render.

import { Position } from 'reactflow';

const TEXT_NODE_HANDLES = [{ name: 'output', type: 'source', position: Position.Right }];

export const textNodeConfig = {
  type: 'text',
  title: 'Text',
  icon: 'type',
  fields: [
    {
      key: 'text',
      label: 'Text:',
      type: 'text',
      defaultValue: '{{input}}',
    },
  ],
  handles: () => TEXT_NODE_HANDLES,
};
