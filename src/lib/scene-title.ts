/**
 * Human-readable scene name for the studio chrome (hero headline, exports,
 * titles). Generated scenes carry a slug like
 * `a-bustling-night-market-with-n`, and the slug is what used to reach the UI.
 * Prefer the scene's own description/title, and fall back to words from the slug.
 */

const tidy = (value: string): string => value.replace(/\s+/g, ' ').replace(/["'`]/g, '').trim();

const fromField = (code: string, field: string): string | undefined => {
  const match = new RegExp(`\\b${field}\\s*:\\s*['"\`]([^'"\`]{2,160})['"\`]`).exec(code);
  return match ? tidy(match[1]) : undefined;
};

/**
 * @param code Generated scene source.
 * @param fallback Used when the code carries no usable name.
 * @param maxWords Longest headline the hero copy block is designed for.
 */
export function sceneTitle(code: string, fallback = 'Live scene', maxWords = 5): string {
  const description = fromField(code, 'description') || fromField(code, 'means');
  const title = fromField(code, 'title');
  const slug = fromField(code, 'name')?.replace(/-/g, ' ');

  // A preset has a real title (“Pier Nine”); a generated scene reuses the
  // prompt as its title, and the description is the untruncated version.
  const source = [title, description, slug].find((value) => value && value.length > 2) || fallback;
  const words = source.split(' ').filter(Boolean).slice(0, maxWords);
  // A prompt truncated mid-word leaves a one- or two-letter tail; drop it.
  if (words.length > 3 && (words[words.length - 1] || '').length <= 2) words.pop();
  // A headline should not end on a dangling connector ("... market with").
  const STOP = new Set(['with', 'and', 'of', 'in', 'at', 'for', 'on', 'the', 'to', 'a', 'an', 'by', 'under', 'over', 'near', 'into', 'onto', 'from', 'across', 'through', 'along', 'against', 'beside', 'between', 'off', 'out', 'up', 'down', 'back', 'that', 'which']);
  while (words.length > 2 && STOP.has((words[words.length - 1] || '').toLowerCase())) words.pop();
  const text = words.join(' ').replace(/[,:;.]+$/, '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
