// NodeField.js
// Renders a single labeled field control from a FieldConfig. Fully controlled —
// no internal state. Number fields are coerced to Number before onChange fires.

import './NodeField.css';

const renderControl = (field, inputId, value, handleChange) => {
  if (field.type === 'select') {
    return (
      <select id={inputId} className="node-field__control" value={value} onChange={handleChange}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        id={inputId}
        className="node-field__control node-field__control--textarea"
        value={value}
        onChange={handleChange}
      />
    );
  }

  return (
    <input
      id={inputId}
      className="node-field__control"
      type={field.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={handleChange}
    />
  );
};

export const NodeField = ({ id, field, value, onChange }) => {
  const inputId = `${id}-${field.key}`;

  const handleChange = (event) => {
    const rawValue = event.target.value;
    const nextValue = field.type === 'number' ? Number(rawValue) : rawValue;
    onChange(field.key, nextValue);
  };

  return (
    <label className="node-field" htmlFor={inputId}>
      <span className="node-field__label">{field.label}</span>
      {renderControl(field, inputId, value, handleChange)}
    </label>
  );
};
