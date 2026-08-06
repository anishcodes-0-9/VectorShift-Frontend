// pipelineSerializer.js
// Pure transform from ReactFlow's store shape to the backend's minimal
// request DTO. The backend only ever needs node/edge ids (to count them and
// to run cycle detection) — never position, selection state, or any node's
// field data, so none of that is sent.

export const toPipelinePayload = (nodes, edges) => ({
  nodes: nodes.map((node) => ({ id: node.id, type: node.type })),
  edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
});
