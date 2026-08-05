// conditionNode.config.js
// Data-only definition of the Condition node. Per NODE-SPECS.md §2, this is a
// deliberately reduced version of a real branching node: a fixed true/false
// pair rather than arbitrary user-defined branches (which would need a list
// field, out of scope for this architecture). Both outputs are static handles
// with no data of their own — pure control-flow routing.

import { Position } from 'reactflow';

export const conditionNodeConfig = {
  type: 'condition',
  title: 'Condition',
  fields: [
    {
      key: 'operator',
      label: 'Operator:',
      type: 'select',
      options: [
        { label: 'Equals', value: 'Equals' },
        { label: 'Contains', value: 'Contains' },
        { label: 'Greater Than', value: 'Greater Than' },
        { label: 'Less Than', value: 'Less Than' },
      ],
      defaultValue: 'Equals',
    },
    {
      key: 'compareValue',
      label: 'Compare Value:',
      type: 'text',
    },
  ],
  handles: [
    { name: 'input', type: 'target', position: Position.Left },
    { name: 'true', type: 'source', position: Position.Right },
    { name: 'false', type: 'source', position: Position.Right },
  ],
};
