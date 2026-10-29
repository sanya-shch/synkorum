// Text layers (Note, Text) are edited through a contentEditable element, which works with
// HTML. The value stored in Liveblocks must be treated as UNTRUSTED: any collaborator
// (including an anonymous guest with an edit share link) can write arbitrary strings into
// storage through the Liveblocks client, bypassing our UI. So:
//   - we always render the stored value through `toEditableHtml` (everything is escaped,
//     the only markup that is ever produced is <br>), and
//   - we store only plain text, produced by `toPlainText` from the editor's HTML.

export const MAX_LAYER_TEXT_LENGTH = 1000;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Plain text from the editor's innerHTML: line breaks become "\n", every other tag is
// dropped, entities are decoded exactly once.
export function toPlainText(html: string): string {
  const text = html
    // Browsers wrap every line after the first in <div>/<p>; an empty line is <div><br></div>.
    .replace(/<(div|p)[^>]*><br\s*\/?><\/\1>/gi, "<$1></$1>")
    .replace(/<(?:div|p)[^>]*>/gi, (_tag, offset: number) => (offset === 0 ? "" : "\n"))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity])
    .replace(/\n+$/, "");

  return text.slice(0, MAX_LAYER_TEXT_LENGTH);
}

// HTML for the contentEditable element. Always safe, whatever `value` contains.
export function toEditableHtml(value: string): string {
  return escapeHtml(value.slice(0, MAX_LAYER_TEXT_LENGTH)).replace(/\n/g, "<br>");
}
