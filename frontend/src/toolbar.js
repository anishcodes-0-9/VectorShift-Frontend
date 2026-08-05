// toolbar.js

import { DraggableNode } from './draggableNode';
import { nodeConfigs } from './nodes/config';

export const PipelineToolbar = () => {

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {nodeConfigs.map((config) => (
                    <DraggableNode key={config.type} type={config.type} label={config.title} />
                ))}
            </div>
        </div>
    );
};
