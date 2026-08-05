// NodeHandles.js
// Renders all Handle elements for a node from its resolved HandleConfig list.
// Owns the position/offset defaults frozen in docs/NODECONFIG-API.md, and is the
// single place that calls useUpdateNodeInternals so no node config has to remember it.

import { useEffect, useMemo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';

const defaultPositionForType = (type) => (type === 'target' ? Position.Left : Position.Right);

const offsetStyleProperty = (position) =>
  position === Position.Top || position === Position.Bottom ? 'left' : 'top';

// Resolves each handle's position (default by type) and offset (evenly spaced
// among other handles sharing the same resolved type+position), matching
// LLMNode's existing hardcoded 100/3, 200/3 placement with zero config.
const resolveHandles = (handles) => {
  const groupSizes = {};
  const resolvedPositions = handles.map((handle) => {
    const position = handle.position ?? defaultPositionForType(handle.type);
    const groupKey = `${handle.type}-${position}`;
    groupSizes[groupKey] = (groupSizes[groupKey] ?? 0) + 1;
    return { handle, position, groupKey };
  });

  const groupIndices = {};
  return resolvedPositions.map(({ handle, position, groupKey }) => {
    const index = groupIndices[groupKey] ?? 0;
    groupIndices[groupKey] = index + 1;
    const offset = handle.offset ?? (100 * (index + 1)) / (groupSizes[groupKey] + 1);
    return { ...handle, position, offset };
  });
};

export const NodeHandles = ({ id, handles }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const resolved = useMemo(() => resolveHandles(handles), [handles]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, resolved, updateNodeInternals]);

  return (
    <>
      {resolved.map((handle) => (
        <Handle
          key={handle.name}
          id={`${id}-${handle.name}`}
          type={handle.type}
          position={handle.position}
          style={{ [offsetStyleProperty(handle.position)]: `${handle.offset}%` }}
        />
      ))}
    </>
  );
};
