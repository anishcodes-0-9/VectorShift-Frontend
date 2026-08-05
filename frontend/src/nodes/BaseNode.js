// BaseNode.js
// Shared shell rendered by every nodeTypes[type] wrapper. Owns presentation
// (container, header) and orchestration (resolving config against data, wiring
// field changes to the store) — no per-node-type business logic.

import { useStore } from '../store';
import { NodeHandles } from './NodeHandles';
import { NodeField } from './NodeField';

// The 4 existing nodes each hardcoded this same inline style; centralized here
// per the blueprint's styling standard instead of repeating it per node.
const CONTAINER_STYLE = { width: 200, height: 80, border: '1px solid black' };

const resolveFieldValue = (field, data, id) => {
  if (data && data[field.key] !== undefined) {
    return data[field.key];
  }

  if (typeof field.defaultValue === 'function') {
    return field.defaultValue(id);
  }

  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.type === 'number') {
    return 0;
  }

  if (field.type === 'select') {
    return field.options?.[0]?.value ?? '';
  }

  return '';
};

export const BaseNode = ({ id, data, config }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  const handles = typeof config.handles === 'function' ? config.handles(data) : config.handles;

  const handleFieldChange = (key, value) => {
    updateNodeField(id, key, value);
  };

  return (
    <div style={CONTAINER_STYLE}>
      <div>
        {config.icon ? <span>{config.icon}</span> : null}
        <span>{config.title}</span>
      </div>
      {config.description ? <div>{config.description}</div> : null}
      {config.fields.map((field) => (
        <NodeField
          key={field.key}
          id={id}
          field={field}
          value={resolveFieldValue(field, data, id)}
          onChange={handleFieldChange}
        />
      ))}
      <NodeHandles id={id} handles={handles} />
    </div>
  );
};
