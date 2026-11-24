// Presentation invariants for CI: no screenshots, no vision, no GIFs.
//
//   node scripts/verify-showcase.mjs           (expects app + API already running)
//   A3D_URL=http://localhost:5174 A3D_API=http://localhost:3001 node scripts/verify-showcase.mjs
//
// It fails (exit 1) when the frame reloads on a presentation switch, when a
// console error appears, when the stage's export stops producing a standalone
// file, when a card duplicates the toolbar's export as its own panel, or when a
// pixel frame collapses back into a postage stamp.
import { chromium } from 'playwright';
import * as fs from 'node:fs';

const APP = process.env.A3D_URL || 'http://localhost:5174';
const API = process.env.A3D_API || 'http://localhost:3001';
const TIMEOUT = Number(process.env.A3D_TIMEOUT_MS) || 60000;

const checks = [];
const fail = (name, detail) => checks.push({ name, ok: false, detail });
const pass = (name, detail = '') => checks.push({ name, ok: true, detail });

const waitFor = async (url, label) => {
  const started = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* server not up yet */ }
    if (Date.now() - started > TIMEOUT) throw new Error(`${label} never became ready at ${url}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
};

await waitFor(`${API}/api/presets`, 'API');
await waitFor(APP, 'Vite app');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
await context.addInitScript(() => {
  try { localStorage.setItem('any3d_theme', 'dark'); } catch { /* ignore */ }
});
const page = await context.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(e.message.slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

const openPreset = async (formatRe, nameRe) => {
  await page.goto(`${APP}/#/studio`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await page.locator('button:visible').filter({ hasText: 'Presets' }).first().click();
  const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
  await modal.waitFor({ state: 'visible', timeout: 20000 });
  const chips = await modal.locator('button').allInnerTexts();
  if (!chips.some((t) => formatRe.test(t))) throw new Error(`gallery has no ${formatRe} filter`);
  await modal.getByRole('button', { name: formatRe }).first().click();
  await page.waitForTimeout(400);
  const card = modal.locator('div.p-4.rounded-2xl').filter({ hasText: nameRe }).first();
  if (!(await card.count())) throw new Error(`preset ${nameRe} missing from the ${formatRe} tab`);
  await card.click({ force: true });
  await page.waitForTimeout(2500);
  const ready = await page.evaluate(() => {
    const doc = document.querySelector('iframe')?.contentDocument;
    return Boolean(doc && doc.querySelector('canvas, svg'));
  });
  if (!ready) throw new Error('preview never mounted a canvas');
  await page.waitForTimeout(1200);
};

const cameraButton = () => page.locator('button:visible').filter({ hasText: /^(iso|top|front|side)$/i }).first();
const pickCamera = async (label) => {
  await cameraButton().click();
  await page.waitForTimeout(300);
  await page.locator('button:visible').filter({ hasText: label }).first().click();
  await page.waitForTimeout(1400);
};
const worldCamera = () => page.evaluate(() => {
  const frame = document.querySelector('iframe');
  return frame?.contentWindow?.__world?.stats?.().camera ?? null;
});
const svgCamera = () => page.evaluate(() => {
  const frame = document.querySelector('iframe');
  return frame?.contentWindow?.__any3d?.camera?.() ?? null;
});

const switchSize = async (label) => {
  await page.locator('button[title^="Web presentation:"]').first().click();
  await page.getByRole('button', { name: label }).first().click();
  await page.waitForTimeout(1500);
};

try {
  // --- gallery coverage: three engines, and no dither tab ------------------
  await page.goto(`${APP}/#/studio`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.locator('button:visible').filter({ hasText: 'Presets' }).first().click();
  const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
  await modal.waitFor({ state: 'visible', timeout: 20000 });
  const tabs = await modal.locator('button').allInnerTexts();
  for (const engine of [/SVG Vector/i, /Three\.js/i, /Pixel Art/i]) {
    if (tabs.some((t) => engine.test(t))) pass(`gallery tab ${engine}`);
    else fail(`gallery tab ${engine}`, 'missing engine filter');
  }
  if (!tabs.some((t) => /dither/i.test(t))) pass('dither engine is gone');
  else fail('dither engine is gone', 'a dither filter is still offered');

  // --- the gallery shows the scenes, not just their names ------------------
  // Forty rows of titles, line counts and file paths, in a scene generator, with
  // no scene on screen: the split view puts the real bundle beside the list.
  const previewFrame = modal.locator('aside iframe').first();
  await previewFrame.waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForTimeout(3500);
  const previewDraws = await previewFrame.evaluate((frame) => {
    const doc = frame.contentDocument;
    if (!doc) return { mounted: false };
    return {
      mounted: true,
      shapes: doc.querySelectorAll('svg *').length + doc.querySelectorAll('canvas').length,
    };
  }).catch(() => ({ mounted: false }));
  if (previewDraws.mounted && previewDraws.shapes > 20)
    pass('the gallery previews the scene', `${previewDraws.shapes} shapes`);
  else fail('the gallery previews the scene', JSON.stringify(previewDraws));

  // Hovering another engine must swap the frame, not keep the first bundle.
  const worldsTab = modal.locator('button').filter({ hasText: /Three\.js/i }).last();
  await worldsTab.click();
  await page.waitForTimeout(700);
  await modal.locator('div.p-4.rounded-2xl').nth(1).hover();
  await page.waitForTimeout(3800);
  const swapped = await previewFrame.evaluate((frame) => {
    const doc = frame.contentDocument;
    return { canvases: doc?.querySelectorAll('canvas').length ?? 0 };
  }).catch(() => ({ canvases: -1 }));
  if (swapped.canvases > 0) pass('the gallery preview follows the pointer', `${swapped.canvases} canvases`);
  else fail('the gallery preview follows the pointer', JSON.stringify(swapped));

  // Exactly one row may look selected, and it must be the one on screen: the row
  // ring used to mark the studio's active scene while the preview showed another.
  const marked = await modal.evaluate((node) => {
    const rows = [...node.querySelectorAll('div.p-4.rounded-2xl')];
    const ringed = rows.filter((r) => /ring-indigo/.test(r.className || ''));
    const previewText = node.querySelector('aside')?.innerText || '';
    return { ringed: ringed.length, title: ringed[0]?.querySelector('span')?.textContent || '', previewText };
  });
  if (marked.ringed === 1 && marked.title && marked.previewText.includes(marked.title))
    pass('the gallery marks the row it previews', marked.title);
  else fail('the gallery marks the row it previews', JSON.stringify(marked));
  const allTab = modal.locator('button').filter({ hasText: /^All \(/ }).first();
  if (await allTab.count()) await allTab.click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');

  // --- the home grid shows scenes, not written prompts --------------------
  // It used to be six prompt cards with no picture: a scene generator whose landing
  // page showed no scenes. Each card now mounts its preset's real bundle.
  await page.goto(`${APP}/#/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await page.evaluate(() =>
    document.querySelectorAll('button[aria-label^="Open "]')[0]?.scrollIntoView({ block: 'center' }),
  );
  await page.waitForTimeout(6000);
  const home = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('button[aria-label^="Open "]')];
    const draws = cards.map((card) => {
      const doc = card.querySelector('iframe')?.contentDocument;
      if (!doc) return 0;
      return doc.querySelectorAll('svg *').length + doc.querySelectorAll('canvas').length;
    });
    return {
      cards: cards.length,
      draws,
      // An equal-height grid: the descriptions are one line everywhere.
      heights: [...new Set(cards.map((c) => Math.round(c.getBoundingClientRect().height)))],
      clipped: cards.filter((card) => {
        const title = [...card.querySelectorAll('span')].find((s) => s.className.includes('truncate'));
        return title ? title.scrollWidth > title.clientWidth + 1 : false;
      }).length,
    };
  });
  if (home.cards >= 3 && home.draws.every((n) => n > 20 || n === 1))
    pass('the home grid runs real scenes', `${home.cards} cards, ${home.draws.join('/')}`);
  else fail('the home grid runs real scenes', JSON.stringify(home));
  if (home.heights.length === 1) pass('the home grid keeps one card height', `${home.heights[0]}px`);
  else fail('the home grid keeps one card height', JSON.stringify(home.heights));
  if (home.clipped === 0) pass('home card titles fit their line');
  else fail('home card titles fit their line', `${home.clipped} truncated`);

  await page.locator('button[aria-label^="Open "]').first().click();
  await page.waitForTimeout(3500);
  const openedFromHome = await page.evaluate(() => ({
    hash: location.hash,
    frame: Boolean(document.querySelector('div[class*="@container"] iframe')),
  }));
  if (/#\/project\//.test(openedFromHome.hash) && openedFromHome.frame)
    pass('a home card opens the scene', openedFromHome.hash);
  else fail('a home card opens the scene', JSON.stringify(openedFromHome));

  // --- one scene, both presentations, frame must survive -------------------
  await openPreset(/Three\.js/i, /bakery/i);
  await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    frame.dataset.probe = 'kept';
    frame.contentWindow.__probe = 'kept';
  });
  await switchSize(/^Hero Section/);
  const hero = await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    const stage = document.querySelector('div[class*="@container"]');
    const area = (el) => (el ? { w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) } : null);
    return {
      elementKept: frame?.dataset.probe === 'kept',
      windowKept: frame?.contentWindow?.__probe === 'kept',
      stage: area(stage),
      frame: area(frame),
      // The exported hero page is the scene, edge to edge. The old preview drew a
      // nav bar and a headline card over it, so the preview promised a page the
      // file never contained.
      chrome: Boolean(document.querySelector('[data-hero-chrome]'))
        || /Start free/.test(document.body.innerText || '')
        || Boolean(document.querySelector('[data-card-expand]')),
      specChips: /ENGINE/i.test(stage?.innerText || '') && /MOTION/i.test(stage?.innerText || ''),
    };
  });
  if (hero.elementKept && hero.windowKept) pass('iframe survives hero switch');
  else fail('iframe survives hero switch', JSON.stringify(hero));
  const heroFills = hero.frame && hero.stage
    && hero.frame.w >= hero.stage.w * 0.97 && hero.frame.h >= hero.stage.h * 0.97;
  if (!hero.chrome && heroFills) pass('hero is the scene and nothing else', `${hero.frame.w}x${hero.frame.h} of ${hero.stage.w}x${hero.stage.h}`);
  else fail('hero is the scene and nothing else', JSON.stringify(hero));
  if (!hero.specChips) pass('hero has no spec chips');
  else fail('hero has no spec chips', 'spec chips leaked into the hero');

  await switchSize(/^Cards Section/);
  const card = await page.evaluate(() => {
    const stage = document.querySelector('div[class*="@container"]');
    const frame = document.querySelector('iframe');
    const text = stage?.innerText || '';
    return {
      stage: stage ? { w: Math.round(stage.clientWidth), h: Math.round(stage.clientHeight) } : null,
      tiles: stage ? stage.querySelectorAll('article').length : 0,
      specChips: /ENGINE/i.test(text) && /MOTION/i.test(text),
      lookStrip: Boolean(stage?.querySelector('[aria-label="Look controls"]')),
      cardLeft: stage?.querySelector('article')?.getBoundingClientRect().left ?? 0,
      stripLeft:
        stage?.querySelector('[aria-label="Look controls"]')?.getBoundingClientRect().left ?? 0,
      stripTop:
        stage?.querySelector('[aria-label="Look controls"]')?.getBoundingClientRect().top ?? 0,
      cardBottom: stage?.querySelector('article')?.getBoundingClientRect().bottom ?? 0,
      exportCards: /Ship this scene|Export HTML/i.test(text),
      // A marketing band above a scene the user is editing ("Cards section /
      // Your scene as a card in a section") cost 54px of the scene at every width.
      sectionBand: /Cards section|Your scene as a card/i.test(text),
      lookControlsInToolbar: document.querySelectorAll(
        'button[title="Atmosphere, lighting & weather controls"]',
      ).length,
      loopControlsInToolbar: [...document.querySelectorAll('button[title]')].filter((b) =>
        /Resume Animation|Show Still Frame/.test(b.getAttribute('title') || ''),
      ).length,
      codePeek: Boolean(stage?.querySelector('div[class*="font-mono"]')),
      frameKept: frame?.dataset.probe === 'kept' && frame?.contentWindow?.__probe === 'kept',
    };
  });
  if (card.frameKept) pass('iframe survives card switch');
  else fail('iframe survives card switch', JSON.stringify(card));
  // The export lives in the toolbar, next to the PNG snapshot. A card that repeats
  // it was the redundancy the project header's own download button already covered.
  if (!card.exportCards) pass('card does not duplicate the export');
  else fail('card does not duplicate the export', 'an export panel is inside the card stage');
  // The scene is the subject of this presentation. Everything else is chrome: the
  // engine/motion chips repeated what the card's own caption and the look strip
  // already say, so the stage carries one tile and nothing above it but a header.
  if (!card.specChips) pass('spec chips do not compete with the card');
  else fail('spec chips do not compete with the card', 'engine/motion chips are back in the stage');
  if (card.tiles === 1) pass('the scene card stands alone', `${card.tiles} article`);
  else fail('the scene card stands alone', `${card.tiles} articles`);
  if (card.lookStrip && card.stripTop >= card.cardBottom - 2 && Math.abs(card.stripLeft - card.cardLeft) < 2)
    pass('look controls sit under the card', `${Math.round(card.stripLeft)}/${Math.round(card.cardLeft)}`);
  else fail('look controls sit under the card', JSON.stringify({ strip: card.stripTop, card: card.cardBottom }));
  // --- a toolbar menu paints above the preview ----------------------------
  // The toolbar scrolls horizontally to stay one row, and a scroll container clips
  // absolutely positioned descendants. Every menu opened from it was laid out
  // correctly and painted nowhere — a button that looks like it does nothing.
  // AnchoredPanel renders them into a portal instead.
  const finishTrigger = page.locator('button[title^="Render style and finish"]').first();
  if (await finishTrigger.count()) {
    await finishTrigger.click();
    await page.waitForTimeout(500);
    const menu = await page.evaluate(() => {
      const panel = document.querySelector('[data-any3d-panel]');
      if (!panel) return { panel: false };
      const r = panel.getBoundingClientRect();
      return {
        panel: true,
        sized: r.width > 80 && r.height > 40,
        inside: panel.contains(document.elementFromPoint(r.x + r.width / 2, r.y + 20)),
      };
    });
    if (menu.panel && menu.sized && menu.inside) pass('a toolbar menu paints above the scene');
    else fail('a toolbar menu paints above the scene', JSON.stringify(menu));

    // ...and choosing an option has to land. A menu that paints but cannot be
    // clicked is just a different way of being broken.
    const finishBefore = await page.evaluate(() => {
      try { return document.querySelector('div[class*="@container"] iframe')?.contentWindow?.__world?.stats?.().finish ?? null; } catch { return null; }
    });
    const panel = page.locator('[data-any3d-panel]').first();
    const pixelOption = panel.getByRole('button').filter({ hasText: /^pixel/i }).first();
    if (finishBefore && (await pixelOption.count())) {
      await pixelOption.click();
      await page.waitForTimeout(1500);
      const finishAfter = await page.evaluate(() => {
        try { return document.querySelector('div[class*="@container"] iframe')?.contentWindow?.__world?.stats?.().finish ?? null; } catch { return null; }
      });
      const reopened = page.locator('[data-any3d-panel]').first();
      const stillOpen = await reopened.count();
      if (finishAfter && finishAfter !== finishBefore && stillOpen === 0)
        pass('a toolbar menu applies its choice', `${finishBefore} -> ${finishAfter}`);
      else fail('a toolbar menu applies its choice', `${finishBefore} -> ${finishAfter}, panels left ${stillOpen}`);
    }
  } else {
    fail('a toolbar menu paints above the scene', 'no finish control in the toolbar');
  }

  // Nothing above the card but the stage toolbar: the section band was demo copy
  // in an editor, and it pushed the scene down by its own height.
  if (!card.sectionBand) pass('the stage has no demo band above the scene');
  else fail('the stage has no demo band above the scene', 'a section header is back in the stage');
  // One owner per control. The strip carries the look and the play state in this
  // presentation, so the toolbar must not repeat them beside it.
  if (card.lookControlsInToolbar === 0 && card.loopControlsInToolbar === 0)
    pass('the card presentation owns its own controls');
  else
    fail(
      'the card presentation owns its own controls',
      `toolbar repeats look x${card.lookControlsInToolbar}, loop x${card.loopControlsInToolbar}`,
    );

  // --- expanding the card shows the scene, not a bigger card --------------
  const frameBox = () =>
    page.evaluate(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
      const stage = document.querySelector('div[class*="@container"]');
      return {
        stage: r(stage),
        frame: r(document.querySelector('div[class*="@container"] iframe')),
        cardChrome: Boolean(document.querySelector('[data-card-expand]')),
        exit: Boolean(document.querySelector('button[title^="Exit full screen"]')),
      };
    });

  const expander = page.locator('[data-card-expand]').first();
  if (await expander.count()) {
    const before = await frameBox();
    await expander.click();
    await page.waitForTimeout(1200);
    const after = await frameBox();
    const fills = after.stage && after.frame
      && after.frame[0] >= after.stage[0] * 0.97 && after.frame[1] >= after.stage[1] * 0.97;
    if (fills && !after.cardChrome && after.exit)
      pass('expanding the card fills the screen with the scene', `${after.frame[0]}x${after.frame[1]} from ${before.frame[0]}x${before.frame[1]}`);
    else
      fail(
        'expanding the card fills the screen with the scene',
        JSON.stringify({ before, after, fills: Boolean(fills) }),
      );

    const exited = page.locator('button[title^="Exit full screen"]').first();
    await exited.click();
    await page.waitForTimeout(1000);
    const restored = await frameBox();
    // The card is fitted to the stage width, so the width barely moves; what comes
    // back is the 4:3 box (a fraction of the stage height) and the chrome.
    const back = restored.stage && restored.frame
      && restored.frame[1] <= restored.stage[1] * 0.85 && restored.cardChrome && !restored.exit;
    if (back) pass('exiting restores the card');
    else fail('exiting restores the card', JSON.stringify(restored));
  } else {
    fail('expanding the card fills the screen with the scene', 'no expand control in the card');
  }

  // --- the stage toolbar exports a standalone file ------------------------
  // The toolbar sits above the @container stage, so look for the chip on the page.
  const htmlButton = page.locator('button[title*="standalone offline HTML"]:visible').first();
  if ((await htmlButton.count()) > 0) pass('the stage toolbar exports HTML');
  else fail('the stage toolbar exports HTML', 'no HTML button on the stage toolbar');

  const download = page.waitForEvent('download', { timeout: 45000 }).catch(() => null);
  await htmlButton.click();
  const event = await download;
  if (!event) fail('the stage export is standalone', 'no download started');
  const file = event ? await event.path() : '';
  const html = file ? fs.readFileSync(file, 'utf8') : '';
  const selfContained = /mountWorld|Any3d\.figure|Pixel\.mount/.test(html) && html.length > 100000;
  const stamped = /\bsize\s*:\s*['"](card|hero)['"]/.test(html);
  if (selfContained && stamped) pass('the stage export is standalone', `${Math.round(html.length / 1024)} KB`);
  else fail('the stage export is standalone', JSON.stringify({ selfContained, stamped, bytes: html.length }));

  // --- light mode has no black holes -------------------------------------
  // Regression guard: the surfaces are written with opacity suffixes
  // (`bg-[#0c0e17]/95`) and the light-theme remap enumerated exact classes, so
  // the workspace toolbar, the card tiles and the card stage gradient stayed
  // near-black under a light page.
  const lightToggle = page.locator('button[aria-label="Switch to light mode"]:visible').first();
  if ((await lightToggle.count()) > 0) {
    await lightToggle.click();
    await page.waitForTimeout(1200);
  }
  const darkSurfaces = await page.evaluate(() => {
    // Tailwind resolves opacity-modified colours to oklab(), so a plain rgb()
    // regex silently skipped exactly the surfaces that were still black. Round
    // every colour through a canvas to get an sRGB value.
    const canvas = document.createElement('canvas').getContext('2d');
    const readColor = (color) => {
      canvas.fillStyle = '#000';
      canvas.fillStyle = color;
      const value = String(canvas.fillStyle);
      const hex = /^#([0-9a-f]{6})$/i.exec(value);
      if (hex) {
        const n = parseInt(hex[1], 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
      }
      const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(value);
      if (!m) return null;
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
    };
    const found = [];
    const walk = (el) => {
      for (const node of el.children) {
        if (node.tagName === 'IFRAME') continue;
        const style = getComputedStyle(node);
        const c = readColor(style.backgroundColor);
        if (c && c.a > 0.5) {
          const luma = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
          const box = node.getBoundingClientRect();
          if (luma < 70 && box.width * box.height > 2500 && box.width > 60 && box.height > 12) {
            found.push({
              cls: (node.className || '').toString().slice(0, 70),
              bg: style.backgroundColor,
              w: Math.round(box.width),
              h: Math.round(box.height),
            });
          }
        }
        walk(node);
      }
    };
    walk(document.body);
    return found.slice(0, 5);
  });
  if (darkSurfaces.length === 0) pass('light theme has no black surfaces');
  else fail('light theme has no black surfaces', JSON.stringify(darkSurfaces));
  const backToDark = page.locator('button[aria-label="Switch to dark mode"]:visible').first();
  if ((await backToDark.count()) > 0) {
    await backToDark.click();
    await page.waitForTimeout(900);
  }

  // --- a world takes its look from the studio instead of a fixed dark sky --
  // Regression guard: worlds used to ignore the look entirely and sit on the dark
  // placeholder backdrop under noon lighting, which read as a black banner.
  await openPreset(/Three\.js/i, /florist|bakery/i);
  await switchSize(/^Hero Section/);
  await page.waitForTimeout(2600);
  const worldFrame = page.frames().find((f) => f !== page.mainFrame());
  const skyAt = async (look) => {
    if (look) {
      await page.evaluate((value) => {
        const frame = document.querySelector('iframe');
        frame?.contentWindow?.postMessage({ type: 'any3d-world', look: value }, '*');
      }, look);
      await page.waitForTimeout(1000);
    }
    return worldFrame.evaluate(async () => {
      const canvas = document.querySelector('#stage canvas');
      if (!canvas) return null;
      const img = new Image();
      img.src = canvas.toDataURL('image/png');
      await img.decode();
      const off = document.createElement('canvas');
      off.width = img.width;
      off.height = img.height;
      off.getContext('2d').drawImage(img, 0, 0);
      // Right side, just above the bottom scrim: sky in every look, unmasked by copy.
      const { data } = off.getContext('2d').getImageData(img.width - 8, Math.round(img.height * 0.42), 1, 1);
      return Math.round((data[0] + data[1] + data[2]) / 3);
    });
  };
  const noonSky = await skyAt({ timeOfDay: 1 / 3, weather: 'clear' });
  const nightSky = await skyAt({ timeOfDay: 1, weather: 'clear' });
  if (noonSky > 120 && nightSky < 80) pass('world look reaches the runtime', `noon ${noonSky} -> night ${nightSky}`);
  else fail('world look reaches the runtime', `noon ${noonSky}, night ${nightSky}`);
  await skyAt({ timeOfDay: 1 / 3, weather: 'clear' });

  // --- pixel art must fill its frame, not sit in the middle ----------------
  await openPreset(/Pixel Art/i, /flower/i);
  await switchSize(/^Cards Section/);
  const pixel = await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    const canvas = frame?.contentDocument?.querySelector('canvas');
    if (!canvas || !frame) return null;
    const art = canvas.getBoundingClientRect();
    const box = frame.getBoundingClientRect();
    return { ratio: art.width / box.width, height: art.height / box.height };
  });
  if (pixel && pixel.ratio > 0.9 && pixel.height > 0.9) pass('pixel art fills its card', JSON.stringify(pixel));
  else fail('pixel art fills its card', JSON.stringify(pixel));

  // --- camera presets: 3D engines take the angle, 2D engines have none ------
  await openPreset(/Three\.js/i, /florist|bakery/i);
  const isoWorld = await worldCamera();
  await pickCamera('Top (Plan)');
  const topWorld = await worldCamera();
  await pickCamera('Side Elevation');
  const sideWorld = await worldCamera();
  await pickCamera('Isometric View');
  const backWorld = await worldCamera();
  const worldMoved = topWorld?.el === 85 && sideWorld?.az === 85 && backWorld?.az === isoWorld?.az && backWorld?.el === isoWorld?.el;
  if (isoWorld && worldMoved) pass('world camera presets apply', `${isoWorld.az}/${isoWorld.el} -> ${topWorld.az}/${topWorld.el} -> back ${backWorld.az}/${backWorld.el}`);
  else fail('world camera presets apply', JSON.stringify({ isoWorld, topWorld, sideWorld, backWorld }));

  await openPreset(/SVG Vector/i, /harbour|airport/i);
  const isoSvg = await svgCamera();
  await pickCamera('Top (Plan)');
  const topSvg = await svgCamera();
  await pickCamera('Isometric View');
  const backSvg = await svgCamera();
  const svgMoved = topSvg?.el === 85 && Math.abs((backSvg?.az ?? 0) - (isoSvg?.az ?? -1)) < 0.01;
  if (isoSvg && svgMoved) pass('svg camera presets apply', `${isoSvg.az}/${isoSvg.el} -> ${topSvg.az}/${topSvg.el} -> back ${backSvg.az}/${backSvg.el}`);
  else fail('svg camera presets apply', JSON.stringify({ isoSvg, topSvg, backSvg }));

  await openPreset(/Pixel Art/i, /flower/i);
  const cameraOffered = await cameraButton().count();
  if (!cameraOffered) pass('camera hidden for the 2D engines');
  else fail('camera hidden for the 2D engines', 'camera control shown for pixel art');

  // --- the card section fits its stage -----------------------------------
  // A wide pane on a short screen used to clip the live card and make the section
  // scroll: the tiles were pinned to a fixed design width whatever the height. The
  // card is now fitted against the real layout, so the scene stays whole and keeps
  // the lion's share of the stage on a short screen too.
  const previousViewport = page.viewportSize();
  await page.setViewportSize({ width: 2200, height: 760 });
  await openPreset(/SVG Vector/i, /pier nine/i);
  await switchSize(/^Cards Section/);
  await page.waitForTimeout(2400);
  const fit = await page.evaluate(() => {
    const stage = document.querySelector('div[class*="@container"]');
    if (!stage) return null;
    const crop = stage.querySelector('iframe')?.parentElement;
    return {
      stageH: stage.clientHeight,
      stageW: stage.clientWidth,
      overflow: stage.scrollHeight - stage.clientHeight,
      tiles: stage.querySelectorAll('article').length,
      cropShare: crop ? Math.round((crop.getBoundingClientRect().height / stage.clientHeight) * 100) : 0,
    };
  });
  if (fit && fit.overflow <= 0 && fit.tiles === 1 && fit.cropShare >= 40)
    pass('the scene card fills a short stage', JSON.stringify(fit));
  else fail('the scene card fills a short stage', JSON.stringify(fit));
  if (previousViewport) await page.setViewportSize(previousViewport);
  await page.waitForTimeout(800);
} catch (error) {
  fail('run', String(error).slice(0, 300));
}

if (consoleErrors.length) fail('console is clean', consoleErrors.slice(0, 3).join(' | '));
else pass('console is clean');

await browser.close();

const width = Math.max(...checks.map((c) => c.name.length));
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.name.padEnd(width)}  ${check.detail}`);
}
const failures = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failures.length}/${checks.length} presentation checks passed`);
process.exit(failures.length ? 1 : 0);
