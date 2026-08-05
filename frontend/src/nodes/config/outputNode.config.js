// outputNode.config.js
// Data-only definition of the Output node. Reproduces outputNode.js's existing
// behavior exactly — including the pre-existing "Image" option carrying
// value="File", preserved byte-for-byte rather than fixed here.

import { Position } from 'reactflow';

export const outputNodeConfig = {
  type: 'customOutput',
  title: 'Output',
  fields: [
    {
      key: 'outputName',
      label: 'Name:',
      type: 'text',
      defaultValue: (id) => id.replace('customOutput-', 'output_'),
    },
    {
      key: 'outputType',
      label: 'Type:',
      type: 'select',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'Image', value: 'File' },
      ],
      defaultValue: 'Text',
    },
  ],
  handles: [{ name: 'value', type: 'target', position: Position.Left }],
};
