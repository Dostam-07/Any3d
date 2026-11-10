import { diffScene, revertHunk, splitLines, hunkHeader } from '../src/lib/diff';

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function eq(label: string, actual: unknown, expected: unknown) {
  check(label, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}

/* 1. A single added prop line is exactly one hunk, and it is the added line. */
const v2 = `Any3d.figure({
  name: 'kiosk',
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(3, 3, pal.ground, 0, 0, 0);
    D.box(1, .5, 1, pal.paper, 0, .25, 0);
    return {};
  }
});`;

const v3 = `Any3d.figure({
  name: 'kiosk',
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(3, 3, pal.ground, 0, 0, 0);
    D.box(1, .5, 1, pal.paper, 0, .25, 0);
    D.props.lamp(1.2, 0.4, null, { h: 2.8 });
    return {};
  }
});`;

const d1 = diffScene(v2, v3);
eq('one hunk', d1.hunks.length, 1);
eq('one addition', d1.added, 1);
eq('no removals', d1.removed, 0);
check(
  'the added line is the prop line',
  d1.hunks[0].lines.filter((l) => l.kind === 'add').map((l) => l.text).join('\n') === '    D.props.lamp(1.2, 0.4, null, { h: 2.8 });'
);
check('the addition is marked with a plus', hunkHeader(d1.hunks[0]).includes('+'));
eq('right line number is the new line', d1.hunks[0].lines.find((l) => l.kind === 'add')?.rightNo, 7);
eq('left line number is absent on additions', d1.hunks[0].lines.find((l) => l.kind === 'add')?.leftNo, null);

/* 2. Reverting that hunk restores v2 exactly. */
eq('revert restores the previous version', revertHunk(v3, d1.hunks[0]), v2);

/* 3. Two edits further apart than 2×context are two hunks, and reverting one
   leaves the other. */
const v2long = `Any3d.figure({
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
const v4 = v2long
  .replace("name: 'kiosk'", "name: 'kiosk-2'")
  .replace('return {};', "D.box(.2, .2, .2, pal.accent, 2, .1, 2);\n    return {};");
const d2 = diffScene(v2long, v4);
eq('two hunks for two distant edits', d2.hunks.length, 2);
eq('two additions', d2.added, 2);
eq('one removal', d2.removed, 1);

const revertedFirst = revertHunk(v4, d2.hunks[0]);
check('first hunk reverted', revertedFirst !== null && revertedFirst.includes("name: 'kiosk'"));
check('second edit survives the first revert', revertedFirst !== null && revertedFirst.includes('pal.accent, 2, .1, 2'));

const bothReverted = revertedFirst ? revertHunk(revertedFirst, d2.hunks[1]) : null;
eq('reverting both hunks restores the original', bothReverted, v2long);

/* 4. A stale hunk refuses to apply. */
eq('stale hunk is refused', revertHunk(v4.replace('pal.paper', 'pal.cloud'), d1.hunks[0]), null);

/* 5. Identical input. */
const same = diffScene(v2, v2);
eq('identical input has no hunks', same.hunks.length, 0);
check('identical input is flagged', same.identical);

/* 6. CRLF and trailing-newline handling. */
eq('CRLF splits the same way', splitLines('a\r\nb\r\n'), ['a', 'b']);
eq('trailing newline is not a line', splitLines('a\nb\n').length, 2);
const crlfDiff = diffScene('a\r\nb\r\n', 'a\r\nc\r\n');
eq('CRLF diff sees one change', crlfDiff.hunks.length, 1);
eq('CRLF revert restores the original text', revertHunk('a\nc', crlfDiff.hunks[0]), 'a\nb');

/* 7. Empty sides. */
eq('empty to content', diffScene('', 'a\nb').added, 2);
eq('content to empty', diffScene('a\nb', '').removed, 2);

console.log(`assertions            : ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
