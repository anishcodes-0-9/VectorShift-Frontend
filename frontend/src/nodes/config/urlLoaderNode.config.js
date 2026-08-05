// urlLoaderNode.config.js
// Data-only definition of the URL Loader node. Per NODE-SPECS.md §3, this is
// one specific loader type (of VectorShift's real five); self-contained with
// no target handles, matching inputNode.config.js's existing shape.

import { Position } from 'reactflow';

export const urlLoaderNodeConfig = {
  type: 'urlLoader',
  title: 'URL Loader',
  fields: [
    {
      key: 'url',
      label: 'URL:',
      type: 'text',
    },
    {
      key: 'recursive',
      label: 'Recursive:',
      type: 'select',
      options: [
        { label: 'Yes', value: 'Yes' },
        { label: 'No', value: 'No' },
      ],
      defaultValue: 'No',
    },
    {
      key: 'rescrapeFrequency',
      label: 'Rescrape Frequency:',
      type: 'select',
      options: [
        { label: 'Never', value: 'Never' },
        { label: 'Hourly', value: 'Hourly' },
        { label: 'Daily', value: 'Daily' },
        { label: 'Weekly', value: 'Weekly' },
        { label: 'Monthly', value: 'Monthly' },
      ],
      defaultValue: 'Never',
    },
  ],
  handles: [{ name: 'content', type: 'source', position: Position.Right }],
};
