// pipelinesApi.js
// Thin fetch wrapper for the /pipelines/parse endpoint. Owns the base URL and
// normalizes both failure modes (network-level rejection and a well-formed
// non-2xx response) into the same error type, so callers only need one catch.

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export class PipelineApiError extends Error {}

export const parsePipeline = async (payload) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/pipelines/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new PipelineApiError('Could not reach the backend. Is it running?');
  }

  if (!response.ok) {
    throw new PipelineApiError(`Backend returned an error (status ${response.status}).`);
  }

  return response.json();
};
