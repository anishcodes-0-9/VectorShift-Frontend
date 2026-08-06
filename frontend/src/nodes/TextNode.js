// TextNode.js
// The actual component registered for the 'text' node type (see
// config/index.js). Everywhere else, a node type is just
// `(props) => <BaseNode {...props} config={config} />` — the Text node needs
// one thing more: its handle list is derived from the text field and must
// change live as the user types (add/remove/reorder {{variable}} handles).
//
// That derivation is memoized here, at the component level, rather than in
// textNode.config.js's `handles` function, because `handles` is a value on a
// single shared config object reused by every Text node instance — it has
// nowhere to keep one instance's "last computed handles" without a
// module-level cache shared across instances. A wrapper component doesn't
// have that problem: React gives each mounted node its own hook state for
// free, scoped to that node's lifetime, with no manual cache/eviction needed.
//
// The `useMemo` below is keyed on `variableKey` (a joined string), not on the
// `variableNames` array itself — `parseTextVariables` returns a fresh array
// every call, so memoizing against the array reference would never hit.
// Keying on its string content lets two renders with the same variable set
// (even from different text) produce the exact same `handles` array
// reference, which is what lets NodeHandles skip its internals-refresh work
// when nothing relevant actually changed.

import { useMemo } from 'react';
import { BaseNode } from './BaseNode';
import { textNodeConfig, DEFAULT_TEXT, buildTextHandles } from './config/textNode.config';
import { parseTextVariables } from './variableParser';

export const TextNode = (props) => {
  const text = props.data?.text ?? DEFAULT_TEXT;

  const variableNames = useMemo(() => parseTextVariables(text), [text]);
  // Safe, unambiguous join key: variable names are validated identifiers and
  // can never contain a space, so two different ordered name lists always
  // produce two different keys.
  const variableKey = variableNames.join(' ');
  // Deliberately keyed on the derived string, not the array (see file header
  // comment), so equal variable sets reuse the same `handles` reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handles = useMemo(() => buildTextHandles(variableNames), [variableKey]);

  const config = { ...textNodeConfig, handles };

  return <BaseNode {...props} config={config} />;
};
