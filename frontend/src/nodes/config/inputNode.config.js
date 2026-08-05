// inputNode.config.js
// Data-only definition of the Input node. Reproduces inputNode.js's existing
// behavior exactly, including the id-derived default name.

import { Position } from 'reactflow';

export const inputNodeConfig = {
  type: 'customInput',
  title: 'Input',
  icon: 'logIn',
  fields: [
    {
      key: 'inputName',
      label: 'Name:',
      type: 'text',
      defaultValue: (id) => id.replace('customInput-', 'input_'),
    },
    {
      key: 'inputType',
      label: 'Type:',
      type: 'select',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'File', value: 'File' },
      ],
      defaultValue: 'Text',
    },
  ],
  handles: [{ name: 'value', type: 'source', position: Position.Right }],
};
