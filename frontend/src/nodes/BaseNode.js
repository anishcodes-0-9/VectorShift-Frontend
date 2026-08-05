// BaseNode.js
// Shared shell rendered by every nodeTypes[type] wrapper. Owns presentation
// (container, header) and orchestration (resolving config against data, wiring
// field changes to the store) — no per-node-type business logic.

import './BaseNode.css';
import { useStore } from '../store';
import { NodeHandles } from './NodeHandles';
import { NodeField } from './NodeField';
import { nodeIcons } from './nodeIcons';

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
  const Icon = config.icon ? nodeIcons[config.icon] : null;

  const handleFieldChange = (key, value) => {
    updateNodeField(id, key, value);
  };

  return (
    <div className="node-card">
      <div className="node-card__header">
        {Icon ? <Icon className="node-card__icon" size={15} strokeWidth={1.75} aria-hidden="true" /> : null}
        <span className="node-card__title">{config.title}</span>
      </div>
      {config.description ? <div className="node-card__description">{config.description}</div> : null}
      {config.fields.length ? (
        <div className="node-card__fields">
          {config.fields.map((field) => (
            <NodeField
              key={field.key}
              id={id}
              field={field}
              value={resolveFieldValue(field, data, id)}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      ) : null}
      <NodeHandles id={id} handles={handles} />
    </div>
  );
};
