from collections import deque
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_methods=['POST'],
    allow_headers=['Content-Type'],
)


class Node(BaseModel):
    id: str
    type: Optional[str] = None


class Edge(BaseModel):
    id: str
    source: str
    target: str


class PipelineRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool


def _is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    # Kahn's algorithm: a graph is acyclic iff repeatedly removing zero
    # in-degree nodes can remove every node. Edges referencing a node id
    # outside `nodes` are ignored rather than raising, so a stale edge left
    # over from a deleted node can't fail the whole request.
    node_ids = {node.id for node in nodes}
    in_degree = {node_id: 0 for node_id in node_ids}
    adjacency = {node_id: [] for node_id in node_ids}

    for edge in edges:
        if edge.source not in node_ids or edge.target not in node_ids:
            continue
        adjacency[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    queue = deque(node_id for node_id, degree in in_degree.items() if degree == 0)
    visited_count = 0

    while queue:
        current = queue.popleft()
        visited_count += 1
        for neighbor in adjacency[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return visited_count == len(node_ids)


@app.get('/')
def read_root():
    return {'Ping': 'Pong'}


@app.post('/pipelines/parse', response_model=PipelineResponse)
def parse_pipeline(pipeline: PipelineRequest):
    return PipelineResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=_is_dag(pipeline.nodes, pipeline.edges),
    )
