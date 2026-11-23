/**
 * The storyboard sheet has to follow the framing the user set up, and the angle
 * set is the part that can be checked without a browser. Built and run by
 * `npm run test:storyboard`.
 */
import {
  STORYBOARD_ANGLES,
  storyboardAngles,
  type StoryboardAngle,
} from '../src/lib/storyboard';

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}${detail ? `  ${detail}` : ''}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}${detail ? `  ${detail}` : ''}`);
  }
}

const labels = (angles: StoryboardAngle[]) => angles.map((a) => a.label).join(' · ');
const keys = (angles: StoryboardAngle[]) =>
  angles.map((a) => `${Math.round(a.az)}/${Math.round(a.el)}`);

// No pick: the classic sheet, unchanged.
check('no pick keeps the classic four', storyboardAngles(null) === STORYBOARD_ANGLES, labels(STORYBOARD_ANGLES));
check('undefined pick keeps the classic four', storyboardAngles(undefined) === STORYBOARD_ANGLES);
check(
  'reset means the authored angle, so the sheet is classic',
  storyboardAngles({ reset: true }) === STORYBOARD_ANGLES
);

// An explicit pick: the user's own angle leads, and the rest are new views.
const top = storyboardAngles({ az: 0, el: 85 });
check('a picked camera leads the sheet', keys(top)[0] === '0/85', keys(top)[0]);
check('a picked camera still fills four tiles', top.length === 4, `${top.length}`);
check('the picked angle is labelled as theirs', top[0].label === 'Your angle', top[0].label);
check('no tile repeats another', new Set(keys(top)).size === 4, keys(top).join(' '));
check('a plan view closes with a view from below the horizon', top[3].label === 'Lower angle', top[3].label);
check('the closing view is not the picked one', keys(top)[3] !== keys(top)[0], keys(top)[3]);

// Values a stored or shared pick can carry: wrap the azimuth, clamp the elevation.
const odd = storyboardAngles({ az: 370, el: -20 });
check('azimuth wraps into 0-360', odd[0].az === 10, String(odd[0].az));
check('elevation clamps to something renderable', odd[0].el === 2, String(odd[0].el));
check('a low pick closes with a higher view', odd[3].label === 'Higher angle', odd[3].label);
check('a low pick is still four distinct views', new Set(keys(odd)).size === 4, keys(odd).join(' '));

// A camera that cannot be applied must not produce a broken sheet.
const broken = storyboardAngles({ az: NaN, el: 30 } as unknown as { az: number; el: number });
check('a non-finite pick falls back to the classic sheet', broken === STORYBOARD_ANGLES);

// The classic set is what the docs promise.
check(
  'the classic set is iso, front, side, plan',
  labels(STORYBOARD_ANGLES) === 'Isometric · Front · Side · Plan',
  labels(STORYBOARD_ANGLES)
);
check(
  'the classic set has no duplicates',
  new Set(STORYBOARD_ANGLES.map((a) => `${a.az}/${a.el}`)).size === 4
);

console.log(`\n${passed}/${passed + failed} storyboard angle checks passed`);
process.exit(failed > 0 ? 1 : 0);
