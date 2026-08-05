// toolbar.js

import './toolbar.css';
import { DraggableNode } from './draggableNode';
import { nodeConfigs } from './nodes/config';

export const PipelineToolbar = () => {
    return (
        <div className="toolbar">
            <span className="toolbar__label">Add a node</span>
            <div className="toolbar__chips">
                {nodeConfigs.map((config) => (
                    <DraggableNode key={config.type} type={config.type} label={config.title} icon={config.icon} />
                ))}
            </div>
        </div>
    );
};
