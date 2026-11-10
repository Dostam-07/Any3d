/**
 * Line diff for scene versions.
 *
 * A scene is plain JavaScript, so a line diff with three lines of context is
 * enough to make chat edits auditable. No dependency: the code is small enough
 * to test directly, and the tests in `scripts/test-diff.ts` pin the behaviour.
 *
 * Hunks carry both sides, so a hunk can be reverted against the newer text
 * without recomputing the diff.
 */

export type DiffKind = 'context' | 'add' | 'remove';

export interface DiffLine {
  kind: DiffKind;
  text: string;
  /** 1-based line number in the left (older) file, null for additions. */
  leftNo: number | null;
  /** 1-based line number in the right (newer) file, null for removals. */
  rightNo: number | null;
}

export interface DiffHunk {
  /** Stable across renders: `leftStart:rightStart`. */
  id: string;
  leftStart: number;
  rightStart: number;
  /** Base side of the hunk: context and removed lines, in order. */
  leftLines: string[];
  /** Newer side: context and added lines, in order. */
  rightLines: string[];
  added: number;
  removed: number;
  lines: DiffLine[];
}

export interface DiffResult {
  hunks: DiffHunk[];
  added: number;
  removed: number;
  identical: boolean;
}

/** Above this, fall back to one whole-file hunk instead of an O(n·m) LCS. */
const LCS_LINE_LIMIT = 2500;

export function splitLines(code: string): string[] {
  if (!code) return [];
  const normalized = code.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  // A trailing newline is a terminator, not an extra empty line.
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

type Op = { kind: 'context' | 'add' | 'remove'; text: string };

function opsViaLcs(a: string[], b: string[]): Op[] {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a[i..] and b[j..]
  const width = m + 1;
  const dp = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * width + j] =
        a[i] === b[j]
          ? dp[(i + 1) * width + j + 1] + 1
          : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    }
  }

  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: 'context', text: a[i] });
      i++;
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      ops.push({ kind: 'remove', text: a[i] });
      i++;
    } else {
      ops.push({ kind: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ kind: 'remove', text: a[i++] });
  while (j < m) ops.push({ kind: 'add', text: b[j++] });
  return ops;
}

function opsWholeFile(a: string[], b: string[]): Op[] {
  const ops: Op[] = a.map((text) => ({ kind: 'remove' as const, text }));
  for (const text of b) ops.push({ kind: 'add', text });
  return ops;
}

/**
 * Diff two versions into hunks with `context` unchanged lines on either side.
 * Identical inputs produce no hunks.
 */
export function diffScene(baseCode: string, nextCode: string, context = 3): DiffResult {
  const base = splitLines(baseCode);
  const next = splitLines(nextCode);

  const ops =
    base.length > LCS_LINE_LIMIT || next.length > LCS_LINE_LIMIT
      ? opsWholeFile(base, next)
      : opsViaLcs(base, next);

  // Line numbers per op.
  let leftNo = 0;
  let rightNo = 0;
  const numbered = ops.map((op) => {
    const line: DiffLine = {
      kind: op.kind,
      text: op.text,
      leftNo: op.kind === 'add' ? null : ++leftNo,
      rightNo: op.kind === 'remove' ? null : ++rightNo,
    };
    return line;
  });

  const changedIdx = numbered
    .map((line, index) => (line.kind === 'context' ? -1 : index))
    .filter((index) => index >= 0);

  if (!changedIdx.length) {
    return { hunks: [], added: 0, removed: 0, identical: true };
  }

  // Group changed lines whose gap is at most 2*context.
  const groups: Array<[number, number]> = [];
  let start = changedIdx[0];
  let end = changedIdx[0];
  for (const index of changedIdx.slice(1)) {
    if (index - end <= context * 2) {
      end = index;
    } else {
      groups.push([start, end]);
      start = index;
      end = index;
    }
  }
  groups.push([start, end]);

  const hunks: DiffHunk[] = groups.map(([first, last]) => {
    const from = Math.max(0, first - context);
    const to = Math.min(numbered.length - 1, last + context);
    const lines = numbered.slice(from, to + 1);

    const leftStart = (lines.find((l) => l.leftNo != null)?.leftNo ?? 1) - 1;
    const rightStart = (lines.find((l) => l.rightNo != null)?.rightNo ?? 1) - 1;

    return {
      id: `${leftStart}:${rightStart}`,
      leftStart,
      rightStart,
      leftLines: lines.filter((l) => l.leftNo != null).map((l) => l.text),
      rightLines: lines.filter((l) => l.rightNo != null).map((l) => l.text),
      added: lines.filter((l) => l.kind === 'add').length,
      removed: lines.filter((l) => l.kind === 'remove').length,
      lines,
    };
  });

  return {
    hunks,
    added: hunks.reduce((sum, hunk) => sum + hunk.added, 0),
    removed: hunks.reduce((sum, hunk) => sum + hunk.removed, 0),
    identical: false,
  };
}

/**
 * Undo one hunk against the newer text: the hunk's newer lines are replaced by
 * its older lines. Returns null when the scene has moved on since the diff was
 * taken, so a stale dialog cannot corrupt an edit.
 */
export function revertHunk(currentCode: string, hunk: DiffHunk): string | null {
  const lines = splitLines(currentCode);
  const slice = lines.slice(hunk.rightStart, hunk.rightStart + hunk.rightLines.length);
  if (slice.length !== hunk.rightLines.length) return null;
  if (slice.some((line, i) => line !== hunk.rightLines[i])) return null;

  return [...lines.slice(0, hunk.rightStart), ...hunk.leftLines, ...lines.slice(hunk.rightStart + hunk.rightLines.length)].join('\n');
}

/** Group a diff for display: hunks keep their own line numbers. */
export function hunkHeader(hunk: DiffHunk): string {
  return `@@ -${hunk.leftStart + 1},${hunk.leftLines.length} +${hunk.rightStart + 1},${hunk.rightLines.length} @@`;
}
