// draggableNode.js

import './draggableNode.css';
import { nodeIcons } from './nodes/nodeIcons';

export const DraggableNode = ({ type, label, icon }) => {
    const Icon = icon ? nodeIcons[icon] : null;

    const onDragStart = (event, nodeType) => {
      const appData = { nodeType }
      event.target.style.cursor = 'grabbing';
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
    };

    return (
      <div
        className="toolbar-chip"
        onDragStart={(event) => onDragStart(event, type)}
        onDragEnd={(event) => (event.target.style.cursor = 'grab')}
        draggable
      >
          {Icon ? <Icon className="toolbar-chip__icon" size={15} strokeWidth={1.75} aria-hidden="true" /> : null}
          <span>{label}</span>
      </div>
    );
  };
