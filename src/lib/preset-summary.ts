/**
 * A preset's own header comment is the best description of it — the authors wrote
 * it for the scene, not for a card. `/* airport · a hero: an airport runway and
 * terminal apron at work. … *​/` becomes "An airport runway and terminal apron at
 * work." Thin or missing headers return an empty string so callers can fall back.
 *
 * Kept small and dependency-free so the home grid and the gallery can share it.
 */
export function presetSummary(code: string, limit = 132): string {
  const comment = code.match(/^\s*\/\*([\s\S]*?)\*\//);
  if (!comment) return '';
  let text = comment[1]
    .replace(/\s+/g, ' ')
    .trim()
    // "airport · a hero: …" — the shared header shape.
    .replace(/^[\w-]+\s*·\s*/, '')
    .replace(/^a (?:hero|card)[^:]*:\s*/i, '')
    .trim();

  // The first sentence is the summary; the rest is implementation detail.
  const stop = text.search(/\.(\s|$)/);
  if (stop > 0) text = text.slice(0, stop + 1);
  text = text.trim();

  if (text.length <= limit) return sentenceCase(text);
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  return sentenceCase(`${cut.slice(0, space > 40 ? space : limit).trim()}…`);
}

function sentenceCase(text: string): string {
  if (!text) return '';
  const first = text[0];
  // Only lift a leading lowercase word; leave "iPhone"-style tokens alone.
  return /[a-z]/.test(first) && !/^[a-z]+[A-Z]/.test(text) ? first.toUpperCase() + text.slice(1) : text;
}

/** True when the summary says less than the title does. */
export function summaryIsThin(summary: string): boolean {
  return summary.replace(/[^a-z]/gi, '').length < 24;
}
