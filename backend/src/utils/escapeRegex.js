// Escape user input so it can be safely embedded in a RegExp.
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
