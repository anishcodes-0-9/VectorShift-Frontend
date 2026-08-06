// variableParser.js
// Pure text -> variable-name parsing for the Text node's {{variable}} syntax.
// No React/ReactFlow imports on purpose: this is plain data-in, data-out logic,
// independently testable from the component that renders it.
//
// Determinism rules for malformed input (explicit, not incidental):
//
// - A {{...}} pair can never "reach across" another `{` or `}` character.
//   The tokenizer's capture group excludes both brace characters outright, so
//   a match can only close at the *nearest* `}}`. This applies identically
//   across line breaks, since a newline is just an ordinary non-brace
//   character to this pattern:
//     - An unclosed `{{` is skipped entirely (treated as literal text) no
//       matter how much text/how many lines separate it from a later `}}` —
//       that later `}}` is only used to close a `{{` that has no intervening
//       brace character, so it will pair with the *next* `{{` instead, or
//       with nothing if there is none.
//     - Nested/doubled braces (`{{ {{x}} }}`) resolve to only the innermost
//       well-formed pair (`{{x}}` -> "x"); the malformed outer wrapper is
//       never matched by anything.
// - Captured content is trimmed with `String.prototype.trim()`, which strips
//   all whitespace, including newlines and tabs. `{{\n  name\n}}` therefore
//   resolves to "name" — multi-line variables are supported for free, using
//   the same rule that already trims `{{ name }}` on a single line.
// - After trimming, the name must match a plain JS-identifier grammar
//   (letters/digits/underscore, not starting with a digit). Anything else
//   (empty, leading digit, hyphen, etc.) is treated as not-a-variable and
//   left as literal text — parsing never throws on malformed input.
// - Duplicate variable names are collapsed to their first occurrence, so
//   handle order matches first-appearance order in the text.

const VARIABLE_PATTERN = /\{\{([^{}]*)\}\}/g;
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-zA-Z0-9_]*$/;

export const isValidVariableName = (name) => IDENTIFIER_PATTERN.test(name);

export const parseTextVariables = (text) => {
  const seen = new Set();
  const names = [];

  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1].trim();
    if (isValidVariableName(name) && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }

  return names;
};
