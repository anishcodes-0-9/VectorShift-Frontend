// slackMessageNode.config.js
// Data-only definition of the Slack Message node. Per NODE-SPECS.md §4, this
// node has no output handles at all — it exists purely for a side effect,
// proving the shell degrades cleanly to "nothing on the source side."

import { Position } from 'reactflow';

export const slackMessageNodeConfig = {
  type: 'slackMessage',
  title: 'Slack Message',
  fields: [
    {
      key: 'channel',
      label: 'Channel:',
      type: 'text',
    },
    {
      key: 'fallbackMessage',
      label: 'Fallback Message:',
      type: 'text',
    },
  ],
  handles: [{ name: 'message', type: 'target', position: Position.Left }],
};
