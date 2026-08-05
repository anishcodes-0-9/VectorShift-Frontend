// nodes/config/index.js
// Single registration point read by ui.js (needs nodeTypes) and, in a future
// milestone, the toolbar (needs nodeConfigs). Asserts each config's `type`
// matches its registry key so the two can't silently drift as nodes are added.

import { BaseNode } from '../BaseNode';
import { inputNodeConfig } from './inputNode.config';
import { llmNodeConfig } from './llmNode.config';
import { outputNodeConfig } from './outputNode.config';
import { textNodeConfig } from './textNode.config';
import { knowledgeBaseNodeConfig } from './knowledgeBaseNode.config';
import { conditionNodeConfig } from './conditionNode.config';
import { urlLoaderNodeConfig } from './urlLoaderNode.config';
import { slackMessageNodeConfig } from './slackMessageNode.config';
import { customApiRequestNodeConfig } from './customApiRequestNode.config';

const registryEntries = [
  ['customInput', inputNodeConfig],
  ['llm', llmNodeConfig],
  ['customOutput', outputNodeConfig],
  ['text', textNodeConfig],
  ['knowledgeBase', knowledgeBaseNodeConfig],
  ['condition', conditionNodeConfig],
  ['urlLoader', urlLoaderNodeConfig],
  ['slackMessage', slackMessageNodeConfig],
  ['customApiRequest', customApiRequestNodeConfig],
];

registryEntries.forEach(([registryKey, config]) => {
  if (config.type !== registryKey) {
    throw new Error(`Node config type "${config.type}" does not match its registry key "${registryKey}"`);
  }
});

export const nodeConfigs = registryEntries.map(([, config]) => config);

export const nodeTypes = Object.fromEntries(
  registryEntries.map(([registryKey, config]) => [registryKey, (props) => <BaseNode {...props} config={config} />])
);
