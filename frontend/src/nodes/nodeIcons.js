// nodeIcons.js
// The one shared icon lookup docs/NODECONFIG-API.md §3 describes: config.icon
// is "a key into one shared icon lookup" (plain data, not a component or SVG
// passed through config). Config files name a key from this object; nothing
// else in the app imports lucide-react directly.

import { LogIn, LogOut, Sparkles, Type, BookOpen, GitBranch, Globe, MessageSquare, Code2 } from 'lucide-react';

export const nodeIcons = {
  logIn: LogIn,
  logOut: LogOut,
  sparkles: Sparkles,
  type: Type,
  bookOpen: BookOpen,
  gitBranch: GitBranch,
  globe: Globe,
  messageSquare: MessageSquare,
  code: Code2,
};
