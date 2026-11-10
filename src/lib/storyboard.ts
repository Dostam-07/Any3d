/**
 * Storyboard sheet — four camera angles of one SVG scene composited into a
 * single 2400×1350 PNG with the scene name burned in.
 *
 * Angles come from the figure's own `camera` option, so this re-mounts the
 * scene four times inside the preview iframe with a different `camera` and
 * serialises the SVG after each mount. That is why the sheet is SVG-only: the
 * canvas engines keep their camera inside Three.js, where there is no
 * data-driven equivalent, and pretending four crops were four angles would be
 * a lie on a pitch deck.
 *
 * The scene is restored to its original angle when the sheet is finished.
 */

import { svgMarkupAtSize } from './turntable';

export const STORYBOARD_WIDTH = 2400;
export const STORYBOARD_HEIGHT = 1350;

export interface StoryboardAngle {
  id: string;
  label: string;
  /** Degrees around the vertical axis. */
  az: number;
  /** Degrees above the horizon. */
  el: number;
}

/** Four readable angles: the house isometric, a front, a side, and a plan. */
export const STORYBOARD_ANGLES: StoryboardAngle[] = [
  { id: 'iso', label: 'Isometric', az: 45, el: 35.264 },
  { id: 'front', label: 'Front', az: 0, el: 16 },
  { id: 'side', label: 'Side', az: 90, el: 16 },
  { id: 'plan', label: 'Plan', az: 45, el: 66 },
];

export interface StoryboardResult {
  blob: Blob;
  width: number;
  height: number;
  bytes: number;
  name: string;
  angles: string[];
  /**
   * Largest luminance difference between the title band and the sheet
   * background. Used by the checks to prove the name was actually burned in
   * rather than merely asked for.
   */
  nameContrast: number;
}

interface StoryboardOptions {
  name?: string;
  background?: string;
  onProgress?: (progress: number) => void;
}

const BACKGROUND = '#0c0e17';
const PAD = 64;
const GAP = 40;
const HEADER = 236;

/** Smallest iframe-side API surface this module drives. */
interface Mountable {
  figures?: unknown[];
  mount?: (fig: unknown, opts: Record<string, unknown>) => { destroy?: () => void };
}

function rasterise(markup: string, width: number, height: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not prepare a storyboard tile'));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not rasterise a storyboard angle'));
    };
    image.src = url;
  });
}

/** Draw one tile: card, fitted scene, angle label. */
function drawTile(
  g: CanvasRenderingContext2D,
  tile: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string
): void {
  g.fillStyle = '#11141f';
  g.fillRect(x, y, width, height);
  g.strokeStyle = 'rgba(255,255,255,0.08)';
  g.lineWidth = 2;
  g.strokeRect(x + 1, y + 1, width - 2, height - 2);

  const fit = Math.min(width / tile.width, height / tile.height);
  const drawWidth = Math.round(tile.width * fit);
  const drawHeight = Math.round(tile.height * fit);
  g.drawImage(
    tile,
    x + Math.round((width - drawWidth) / 2),
    y + Math.round((height - drawHeight) / 2),
    drawWidth,
    drawHeight
  );

  g.fillStyle = 'rgba(248,250,252,0.92)';
  g.font = '600 26px "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif';
  g.fillText(label, x + 26, y + height - 26);
}

/** Compose tiles into the 2400×1350 sheet with the scene name burned in. */
export function composeStoryboard(
  tiles: HTMLCanvasElement[],
  name: string,
  background = BACKGROUND
): { canvas: HTMLCanvasElement; nameContrast: number } {
  const canvas = document.createElement('canvas');
  canvas.width = STORYBOARD_WIDTH;
  canvas.height = STORYBOARD_HEIGHT;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('Could not prepare the storyboard canvas');

  g.fillStyle = background;
  g.fillRect(0, 0, STORYBOARD_WIDTH, STORYBOARD_HEIGHT);

  const safeName = (name || 'Untitled scene').replace(/\s+/g, ' ').trim().slice(0, 48);
  g.fillStyle = '#f8fafc';
  g.font = '800 76px "Bricolage Grotesque", "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif';
  g.fillText(safeName, PAD, 118);

  g.fillStyle = '#94a3b8';
  g.font = '500 30px "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif';
  g.fillText('Any3d storyboard · four angles', PAD, 168);

  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(PAD, 198, STORYBOARD_WIDTH - PAD * 2, 2);

  const tileWidth = Math.floor((STORYBOARD_WIDTH - PAD * 2 - GAP) / 2);
  const tileHeight = Math.floor((STORYBOARD_HEIGHT - HEADER - PAD - GAP) / 2);

  tiles.slice(0, 4).forEach((tile, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = PAD + column * (tileWidth + GAP);
    const y = HEADER + row * (tileHeight + GAP);
    drawTile(g, tile, x, y, tileWidth, tileHeight, STORYBOARD_ANGLES[index].label);
  });

  // Prove the title is on the pixels: compare the title band against the corner.
  const band = g.getImageData(PAD, 56, Math.min(760, STORYBOARD_WIDTH - PAD * 2), 64).data;
  const corner = g.getImageData(4, STORYBOARD_HEIGHT - 8, 1, 1).data;
  const cornerLuma = 0.2126 * corner[0] + 0.7152 * corner[1] + 0.0722 * corner[2];
  let nameContrast = 0;
  for (let i = 0; i < band.length; i += 4) {
    const luma = 0.2126 * band[i] + 0.7152 * band[i + 1] + 0.0722 * band[i + 2];
    const delta = Math.abs(luma - cornerLuma);
    if (delta > nameContrast) nameContrast = delta;
  }

  return { canvas, nameContrast: Math.round(nameContrast) };
}

/**
 * Render the sheet from a preview iframe.
 *
 * Only the SVG engine is supported: the four angles are the figure's `camera`
 * option, which the canvas engines do not expose. The caller is expected to
 * explain that rather than silently exporting four identical frames.
 */
export async function renderStoryboard(
  iframe: HTMLIFrameElement,
  options: StoryboardOptions = {}
): Promise<StoryboardResult> {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow as
    | (Window & { Any3d?: Mountable; __any3dLook?: unknown })
    | null;
  if (!doc || !win) throw new Error('Preview is not ready — wait for the scene to load');

  const Api = win.Any3d;
  if (!Api || typeof Api.mount !== 'function') throw new Error('This scene has no mountable runtime');
  if (!doc.querySelector('svg')) {
    throw new Error('Storyboard angles are SVG-only — switch the scene to the SVG engine.');
  }

  const figures = Api.figures as { camera?: unknown; size?: unknown }[] | undefined;
  const fig = figures && figures.length ? figures[figures.length - 1] : null;
  if (!fig) throw new Error('No figure declared in the preview');

  const stage = (doc.getElementById('stage') || doc.querySelector('.stage')) as HTMLElement | null;
  if (!stage) throw new Error('The preview has no stage to draw into');

  const name = options.name || (fig as { title?: string }).title || 'Untitled scene';
  const look = win.__any3dLook || undefined;

  // Tile size: the sheet grid, at 2× so the PNG is crisp on a projector.
  const tileWidth = Math.floor((STORYBOARD_WIDTH - PAD * 2 - GAP) / 2) * 2;
  const tileHeight = Math.floor((STORYBOARD_HEIGHT - HEADER - PAD - GAP) / 2) * 2;

  const tiles: HTMLCanvasElement[] = [];
  let live: { destroy?: () => void } | null = null;

  try {
    for (let i = 0; i < STORYBOARD_ANGLES.length; i++) {
      const angle = STORYBOARD_ANGLES[i];
      if (live && live.destroy) live.destroy();
      live = Api.mount(
        { ...(fig as object), camera: { az: angle.az, el: angle.el, pad: 1.06 } },
        { el: stage, reduced: true, still: true, look }
      );
      const svg = stage.querySelector('svg') as SVGSVGElement | null;
      if (!svg) throw new Error(`The ${angle.label} angle did not render`);
      const markup = svgMarkupAtSize(svg, tileWidth, tileHeight);
      tiles.push(await rasterise(markup, tileWidth, tileHeight));
      options.onProgress?.((i + 1) / STORYBOARD_ANGLES.length);
    }
  } finally {
    // Put the scene back the way the user left it.
    if (live && live.destroy) live.destroy();
    try {
      Api.mount(fig, { el: stage, reduced: false, look });
    } catch {
      // The preview can be reloaded from the toolbar; not worth failing the sheet.
    }
  }

  const { canvas, nameContrast } = composeStoryboard(tiles, name, options.background);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Could not encode the storyboard PNG'))),
      'image/png'
    );
  });

  return {
    blob,
    width: STORYBOARD_WIDTH,
    height: STORYBOARD_HEIGHT,
    bytes: blob.size,
    name,
    angles: STORYBOARD_ANGLES.map((a) => a.label),
    nameContrast,
  };
}

export function saveStoryboard(blob: Blob, sceneName: string): void {
  const safe = (sceneName || 'scene')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Any3d-${safe || 'scene'}-storyboard.png`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
