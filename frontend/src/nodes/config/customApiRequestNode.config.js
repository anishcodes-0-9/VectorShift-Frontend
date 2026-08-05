// customApiRequestNode.config.js
// Data-only definition of the Custom API Request node. Per NODE-SPECS.md §5,
// headers are a plain textarea rather than a structured list field (a named,
// deliberate downgrade — see NODE-SPECS.md §6); authValue is always rendered
// and ignored at execution time when authType is None, the same
// "always-visible, contextually-ignored" pattern already used by
// inputNode.config.js/outputNode.config.js's own fields.

import { Position } from 'reactflow';

export const customApiRequestNodeConfig = {
  type: 'customApiRequest',
  title: 'Custom API Request',
  icon: 'code',
  fields: [
    {
      key: 'method',
      label: 'Method:',
      type: 'select',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
      defaultValue: 'GET',
    },
    {
      key: 'url',
      label: 'URL:',
      type: 'text',
    },
    {
      key: 'headers',
      label: 'Headers:',
      type: 'textarea',
    },
    {
      key: 'authType',
      label: 'Auth Type:',
      type: 'select',
      options: [
        { label: 'None', value: 'None' },
        { label: 'Bearer Token', value: 'Bearer Token' },
        { label: 'API Key', value: 'API Key' },
      ],
      defaultValue: 'None',
    },
    {
      key: 'authValue',
      label: 'Auth Value:',
      type: 'text',
    },
  ],
  handles: [
    { name: 'body', type: 'target', position: Position.Left },
    { name: 'response', type: 'source', position: Position.Right },
  ],
};
