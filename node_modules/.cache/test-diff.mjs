// src/lib/diff.ts
var LCS_LINE_LIMIT = 2500;
function splitLines(code) {
  if (!code) return [];
  const normalized = code.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}
function opsViaLcs(a, b) {
  const n = a.length;
  const m = b.length;
  const width = m + 1;
  const dp = new Uint32Array((n + 1) * width);
  for (let i2 = n - 1; i2 >= 0; i2--) {
    for (let j2 = m - 1; j2 >= 0; j2--) {
      dp[i2 * width + j2] = a[i2] === b[j2] ? dp[(i2 + 1) * width + j2 + 1] + 1 : Math.max(dp[(i2 + 1) * width + j2], dp[i2 * width + j2 + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: "context", text: a[i] });
      i++;
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      ops.push({ kind: "remove", text: a[i] });
      i++;
    } else {
      ops.push({ kind: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ kind: "remove", text: a[i++] });
  while (j < m) ops.push({ kind: "add", text: b[j++] });
  return ops;
}
function opsWholeFile(a, b) {
  const ops = a.map((text) => ({ kind: "remove", text }));
  for (const text of b) ops.push({ kind: "add", text });
  return ops;
}
function diffScene(baseCode, nextCode, context = 3) {
  const base = splitLines(baseCode);
  const next = splitLines(nextCode);
  const ops = base.length > LCS_LINE_LIMIT || next.length > LCS_LINE_LIMIT ? opsWholeFile(base, next) : opsViaLcs(base, next);
  let leftNo = 0;
  let rightNo = 0;
  const numbered = ops.map((op) => {
    const line = {
      kind: op.kind,
      text: op.text,
      leftNo: op.kind === "add" ? null : ++leftNo,
      rightNo: op.kind === "remove" ? null : ++rightNo
    };
    return line;
  });
  const changedIdx = numbered.map((line, index) => line.kind === "context" ? -1 : index).filter((index) => index >= 0);
  if (!changedIdx.length) {
    return { hunks: [], added: 0, removed: 0, identical: true };
  }
  const groups = [];
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
  const hunks = groups.map(([first, last]) => {
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
      added: lines.filter((l) => l.kind === "add").length,
      removed: lines.filter((l) => l.kind === "remove").length,
      lines
    };
  });
  return {
    hunks,
    added: hunks.reduce((sum, hunk) => sum + hunk.added, 0),
    removed: hunks.reduce((sum, hunk) => sum + hunk.removed, 0),
    identical: false
  };
}
function revertHunk(currentCode, hunk) {
  const lines = splitLines(currentCode);
  const slice = lines.slice(hunk.rightStart, hunk.rightStart + hunk.rightLines.length);
  if (slice.length !== hunk.rightLines.length) return null;
  if (slice.some((line, i) => line !== hunk.rightLines[i])) return null;
  return [...lines.slice(0, hunk.rightStart), ...hunk.leftLines, ...lines.slice(hunk.rightStart + hunk.rightLines.length)].join("\n");
}
function hunkHeader(hunk) {
  return `@@ -${hunk.leftStart + 1},${hunk.leftLines.length} +${hunk.rightStart + 1},${hunk.rightLines.length} @@`;
}

// scripts/test-diff.ts
var passed = 0;
var failed = 0;
function check(label, condition, detail) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL ${label}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}
function eq(label, actual, expected) {
  check(label, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}
var v2 = `Any3d.figure({
  name: 'kiosk',
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(3, 3, pal.ground, 0, 0, 0);
    D.box(1, .5, 1, pal.paper, 0, .25, 0);
    return {};
  }
});`;
var v3 = `Any3d.figure({
  name: 'kiosk',
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(3, 3, pal.ground, 0, 0, 0);
    D.box(1, .5, 1, pal.paper, 0, .25, 0);
    D.props.lamp(1.2, 0.4, null, { h: 2.8 });
    return {};
  }
});`;
var d1 = diffScene(v2, v3);
eq("one hunk", d1.hunks.length, 1);
eq("one addition", d1.added, 1);
eq("no removals", d1.removed, 0);
check(
  "the added line is the prop line",
  d1.hunks[0].lines.filter((l) => l.kind === "add").map((l) => l.text).join("\n") === "    D.props.lamp(1.2, 0.4, null, { h: 2.8 });"
);
check("the addition is marked with a plus", hunkHeader(d1.hunks[0]).includes("+"));
eq("right line number is the new line", d1.hunks[0].lines.find((l) => l.kind === "add")?.rightNo, 7);
eq("left line number is absent on additions", d1.hunks[0].lines.find((l) => l.kind === "add")?.leftNo, null);
eq("revert restores the previous version", revertHunk(v3, d1.hunks[0]), v2);
var v2long = `Any3d.figure({
  name: 'kiosk',
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(3, 3, pal.ground, 0, 0, 0);
    D.box(1, .5, 1, pal.paper, 0, .25, 0);
    D.box(1, .5, 1, pal.paper, 1, .25, 0);
    D.box(1, .5, 1, pal.paper, 2, .25, 0);
    D.box(1, .5, 1, pal.paper, 3, .25, 0);
    D.box(1, .5, 1, pal.paper, 4, .25, 0);
    return {};
  }
});`;
var v4 = v2long.replace("name: 'kiosk'", "name: 'kiosk-2'").replace("return {};", "D.box(.2, .2, .2, pal.accent, 2, .1, 2);\n    return {};");
var d2 = diffScene(v2long, v4);
eq("two hunks for two distant edits", d2.hunks.length, 2);
eq("two additions", d2.added, 2);
eq("one removal", d2.removed, 1);
var revertedFirst = revertHunk(v4, d2.hunks[0]);
check("first hunk reverted", revertedFirst !== null && revertedFirst.includes("name: 'kiosk'"));
check("second edit survives the first revert", revertedFirst !== null && revertedFirst.includes("pal.accent, 2, .1, 2"));
var bothReverted = revertedFirst ? revertHunk(revertedFirst, d2.hunks[1]) : null;
eq("reverting both hunks restores the original", bothReverted, v2long);
eq("stale hunk is refused", revertHunk(v4.replace("pal.paper", "pal.cloud"), d1.hunks[0]), null);
var same = diffScene(v2, v2);
eq("identical input has no hunks", same.hunks.length, 0);
check("identical input is flagged", same.identical);
eq("CRLF splits the same way", splitLines("a\r\nb\r\n"), ["a", "b"]);
eq("trailing newline is not a line", splitLines("a\nb\n").length, 2);
var crlfDiff = diffScene("a\r\nb\r\n", "a\r\nc\r\n");
eq("CRLF diff sees one change", crlfDiff.hunks.length, 1);
eq("CRLF revert restores the original text", revertHunk("a\nc", crlfDiff.hunks[0]), "a\nb");
eq("empty to content", diffScene("", "a\nb").added, 2);
eq("content to empty", diffScene("a\nb", "").removed, 2);
console.log(`assertions            : ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
