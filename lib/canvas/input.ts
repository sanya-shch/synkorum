// True when the event target is a text-input-like element (a plain <input>/<textarea>,
// or a contentEditable div such as the Text/Note layer editors). Keyboard shortcuts
// should not fire while the user is typing into one of these. Duck-typed (not
// `instanceof HTMLElement`) so it also works with plain objects in unit tests.
export function isTypingTarget(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as { tagName?: unknown; isContentEditable?: unknown };
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable === true;
}
