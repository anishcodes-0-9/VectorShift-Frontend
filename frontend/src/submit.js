// submit.js

import { useState } from 'react';
import { shallow } from 'zustand/shallow';
import './submit.css';
import { useStore } from './store';
import { parsePipeline } from './api/pipelinesApi';
import { toPipelinePayload } from './api/pipelineSerializer';

const selector = (state) => ({ nodes: state.nodes, edges: state.edges });

const formatResultMessage = ({ num_nodes, num_edges, is_dag }) =>
  `Pipeline has ${num_nodes} node${num_nodes === 1 ? '' : 's'} and ` +
  `${num_edges} edge${num_edges === 1 ? '' : 's'}.\n\n` +
  (is_dag ? 'This is a valid DAG (no cycles).' : 'This is NOT a valid DAG — it contains a cycle.');

export const SubmitButton = () => {
  const { nodes, edges } = useStore(selector, shallow);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await parsePipeline(toPipelinePayload(nodes, edges));
      alert(formatResultMessage(result));
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="submit-bar">
      <button
        type="button"
        className="submit-bar__button"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
};
