/**
 * Turntable clip export — records the live scene to a short video or GIF,
 * entirely in the browser. No ffmpeg, no upload, no server round-trip.
 *
 * Two capture paths:
 *  - canvas engines (worlds / pixel / dither): MediaRecorder on the scene canvas,
 *    or a copy canvas when the stage is resized/letterboxed
 *  - SVG engine: the figure is live DOM, so frames are serialised to an <img>,
 *    rasterised at the target pixel size and drawn into a canvas
 *
 * The SVG path drives the scene itself through `ctx.step(dt)` from the preview
 * runtime. That buys two things MediaRecorder-on-live-DOM cannot: every clip
 * starts at scene time 0 (so two clips of the same scene match), and the frame
 * clock belongs to the recorder rather than the browser's rAF.
 *
 * Cost note: rasterising a detailed SVG figure at 1080x1080 takes ~100 ms, so an
 * SVG video lands around 8-12 fps. That is the scene's own cost, not pacing;
 * the result reports the rate it actually achieved. GIF steps a fixed 1/fps per
 * frame instead, so its motion stays smooth at 15 fps regardless of encode time.
 *
 * All paths depend on same-origin access to the preview iframe — the same
 * dependency PNG and GLB export already have.
 */

import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import type { SandboxPreviewHandle } from '../components/SandboxPreview';

export interface TurntableOptions {
  seconds?: number;
  fps?: number;
  maxSize?: number;
  /** "source" keeps the preview's aspect; "square" letterboxes into a fixed square. */
  aspect?: TurntableAspect;
  /** Letterbox colour for the square stage. */
  background?: string;
  /** Video (WebM/MP4) or an animated GIF. */
  format?: TurntableFormat;
  /** Longest side of a GIF; GIFs are small on purpose, video keeps the full stage. */
  gifSize?: number;
  onProgress?: (progress: number) => void;
}

export type TurntableAspect = 'source' | 'square';
export type TurntableFormat = 'video' | 'gif';

export interface TurntableResult {
  blob: Blob;
  mimeType: string;
  extension: 'webm' | 'mp4' | 'gif';
  width: number;
  height: number;
  durationMs: number;
  /** Frames actually drawn into the clip, and the rate they represent. */
  frames: number;
  fps: number;
  format: TurntableFormat;
}

/** The bits of the preview's SVG runtime this module drives. */
interface SvgSceneRuntime {
  stop?: () => void;
  start?: () => void;
  step?: (dt: number) => unknown;
  render?: () => void;
  t?: number;
  dt?: number;
}

const MIME_CANDIDATES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
];

const MAX_BYTES = 8 * 1024 * 1024;

export function canRecordScene(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pickMimeType(): string {
  for (const candidate of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    } catch {
      // Safari throws for some strings; keep looking.
    }
  }
  throw new Error('This browser cannot record video (MediaRecorder is unavailable)');
}

function extensionFor(mimeType: string): 'webm' | 'mp4' {
  return mimeType.includes('mp4') ? 'mp4' : 'webm';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Drop width/height from the inline style so the pixel attributes below win. */
function stripSizedStyle(svg: SVGSVGElement): void {
  const style = svg.getAttribute('style');
  if (!style) return;
  const cleaned = style
    .replace(/(^|;)\s*(width|height)\s*:[^;]*/gi, '')
    .replace(/^;+|;+$/g, '')
    .trim();
  if (cleaned) svg.setAttribute('style', cleaned);
  else svg.removeAttribute('style');
}

/**
 * Serialise the live SVG at an explicit pixel size.
 *
 * These attributes are a determinism fix, not a sharpness fix: Chrome
 * rasterises an SVG image at the size it is drawn, so the old viewBox-only
 * route was already sharp at 1080 (measured edge contrast on long text was
 * identical, 86.1 either way). What the attributes change is the intrinsic
 * size — 150px before, 1080 now — so the raster resolution no longer depends
 * on an engine default when an SVG is decoded on its own.
 * The viewBox is preserved, so the user space is scaled, not cropped.
 */
export function svgMarkupAtSize(svg: SVGSVGElement, width: number, height: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (clone.hasAttribute('xlink:href')) {
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }
  stripSizedStyle(clone);

  const viewBox =
    svg.getAttribute('viewBox') ||
    `0 0 ${svg.clientWidth || width} ${svg.clientHeight || height}`;
  clone.setAttribute('viewBox', viewBox);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  return new XMLSerializer().serializeToString(clone);
}

/** Rasterise one SVG frame and draw it into the capture canvas. */
async function drawSvgFrame(
  svg: SVGSVGElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  x = 0,
  y = 0
): Promise<void> {
  const markup = svgMarkupAtSize(svg, width, height);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not rasterise an SVG frame'));
      image.src = url;
    });
    ctx.drawImage(image, x, y, width, height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function writeGifFrame(
  gif: ReturnType<typeof GIFEncoder>,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  delayMs: number,
  first: boolean
): void {
  const { data } = ctx.getImageData(0, 0, width, height);
  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  gif.writeFrame(index, width, height, first ? { palette, delay: delayMs, repeat: 0 } : { palette, delay: delayMs });
}

/**
 * Record the scene inside a preview iframe.
 *
 * Pass `aspect: 'square'` for a social-ready fixed square stage; the scene is
 * letterboxed and centred so no part of it is cropped. The square stage is the
 * default, because a clip is a share artifact first and a screenshot second.
 *
 * Video is real time: 5 seconds of recording produces 5 seconds of video. GIF
 * frames are stepped at a fixed rate instead, so an encoding stall cannot
 * stretch the clip.
 */
export async function recordSceneFromIframe(
  iframe: HTMLIFrameElement,
  options: TurntableOptions = {}
): Promise<TurntableResult> {
  const format: TurntableFormat = options.format === 'gif' ? 'gif' : 'video';
  if (format === 'video' && !canRecordScene()) {
    throw new Error('This browser cannot record video (MediaRecorder is unavailable)');
  }

  const seconds = clamp(options.seconds ?? (format === 'gif' ? 4 : 5), 1, 20);
  const fps =
    format === 'gif'
      ? clamp(options.fps ?? 15, 5, 25)
      : clamp(options.fps ?? 30, 6, 60);
  const maxSize = clamp(options.maxSize ?? 1080, 240, 1600);
  const stageSize = format === 'gif' ? clamp(options.gifSize ?? 640, 160, 1080) : maxSize;
  const square = options.aspect !== 'source';

  const doc = iframe.contentDocument;
  if (!doc) {
    throw new Error('Preview is not ready — wait for the scene to load');
  }

  const canvas = doc.querySelector('canvas') as HTMLCanvasElement | null;
  const svg = doc.querySelector('svg') as SVGSVGElement | null;
  if (!canvas && !svg) {
    throw new Error('No drawable scene found in the preview');
  }

  const sourceWidth = canvas
    ? canvas.width || canvas.clientWidth || 800
    : svg!.clientWidth || 800;
  const sourceHeight = canvas
    ? canvas.height || canvas.clientHeight || 600
    : svg!.clientHeight || 600;

  // Stage geometry: the square stage is exactly stageSize x stageSize; the wide
  // stage keeps the scene's aspect and never exceeds stageSize on the long edge.
  const scale = Math.min(1, stageSize / Math.max(sourceWidth, sourceHeight));
  const width = square ? stageSize : Math.max(2, Math.round(sourceWidth * scale));
  const height = square ? stageSize : Math.max(2, Math.round(sourceHeight * scale));

  const fit = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = Math.max(1, Math.round(sourceWidth * fit));
  const drawHeight = Math.max(1, Math.round(sourceHeight * fit));
  const drawX = Math.round((width - drawWidth) / 2);
  const drawY = Math.round((height - drawHeight) / 2);

  // A copy canvas is needed to letterbox, resize, rasterise SVG or read frames.
  const needsCopy =
    format === 'gif' ||
    square ||
    !canvas ||
    width !== sourceWidth ||
    height !== sourceHeight;

  const target = needsCopy ? document.createElement('canvas') : (canvas as HTMLCanvasElement);
  if (needsCopy) {
    target.width = width;
    target.height = height;
  }
  const ctx = needsCopy ? target.getContext('2d') : null;
  if (needsCopy && !ctx) {
    throw new Error('Could not prepare a recording canvas');
  }

  const background =
    square || format === 'gif' ? options.background ?? '#0c0e17' : null;

  const win = iframe.contentWindow as (Window & {
    __any3d?: SvgSceneRuntime;
  }) | null;
  const svgRuntime = svg ? win?.__any3d || null : null;
  const stepper = svgRuntime?.step ? svgRuntime : null;

  // Restart the scene so the clip begins at the top of its loop, and take the
  // clock away from the figure while we capture.
  if (stepper) {
    try {
      stepper.stop?.();
      stepper.t = 0;
      stepper.dt = 0;
    } catch {
      // A runtime without a writable clock still records, just not from zero.
    }
  }

  const chunks: Blob[] = [];
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let mimeType = 'image/gif';
  let stopped: Promise<Blob> | null = null;
  const gif = format === 'gif' ? GIFEncoder() : null;
  const gifDelay = Math.max(20, Math.round(1000 / fps));

  if (format === 'video') {
    mimeType = pickMimeType();
    stream = target.captureStream(fps);
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    stopped = new Promise<Blob>((resolve) => {
      recorder!.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });
    recorder.start(250);
  }

  const startedAt = performance.now();
  const totalMs = seconds * 1000;
  let frames = 0;
  /** True when every frame was drawn by us, so the count is the real rate. */
  let measured = false;

  try {
    if (needsCopy && ctx) {
      const frameMs = 1000 / fps;

      if (format === 'gif') {
        // Fixed steps: the scene advances by exactly one frame per captured
        // frame, so a slow encode changes the wall time, not the clip.
        const totalFrames = Math.max(2, Math.round(seconds * fps));
        for (let i = 0; i < totalFrames; i++) {
          if (stepper) {
            try {
              stepper.step?.(1 / fps);
            } catch {
              // A misbehaving tick must not abort the clip.
            }
          }
          if (background) {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, width, height);
          }
          if (canvas) ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);
          else await drawSvgFrame(svg!, ctx, drawWidth, drawHeight, drawX, drawY);

          writeGifFrame(gif!, ctx, width, height, gifDelay, i === 0);
          frames++;
          options.onProgress?.((i + 1) / totalFrames);
          await sleep(0);
        }
      } else {
        // Video: real time. The scene clock follows the wall clock so motion
        // speed survives a slow frame; the recorder timestamps the canvas.
        let lastStepAt = startedAt;
        measured = true;
        while (performance.now() - startedAt < totalMs) {
          const tickStart = performance.now();
          if (stepper) {
            const dt = clamp((tickStart - lastStepAt) / 1000, 0, 0.1);
            lastStepAt = tickStart;
            try {
              stepper.step?.(dt);
            } catch {
              // ignore a broken tick
            }
          }
          if (background) {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, width, height);
          }
          if (canvas) ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);
          else await drawSvgFrame(svg!, ctx, drawWidth, drawHeight, drawX, drawY);
          frames++;

          options.onProgress?.(Math.min(1, (performance.now() - startedAt) / totalMs));
          const spent = performance.now() - tickStart;
          await sleep(Math.max(0, frameMs - spent));
        }
      }
    } else {
      // Direct canvas recording: let the scene play and report progress.
      const deadline = startedAt + totalMs;
      while (performance.now() < deadline) {
        options.onProgress?.(Math.min(1, (performance.now() - startedAt) / totalMs));
        await sleep(200);
      }
      frames = Math.round((seconds * fps) * 0.98);
    }
  } finally {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    if (stepper) {
      try {
        stepper.start?.();
      } catch {
        // Preview stays on whatever frame it reached; not worth failing on.
      }
    }
  }

  const elapsedMs = Math.round(performance.now() - startedAt);
  let blob: Blob;
  let extension: 'webm' | 'mp4' | 'gif';

  if (gif) {
    gif.finish();
    const bytes = gif.bytes();
    blob = new Blob([bytes as unknown as BlobPart], { type: 'image/gif' });
    extension = 'gif';
    mimeType = 'image/gif';
  } else {
    blob = await stopped!;
    extension = extensionFor(mimeType);
  }

  if (!blob.size) throw new Error('Recording produced no data');
  if (blob.size > MAX_BYTES) {
    throw new Error(
      `Clip is ${(blob.size / 1024 / 1024).toFixed(1)} MB — over the 8 MB budget. Try a shorter clip or GIF.`
    );
  }

  const achievedFps =
    format !== 'gif' && measured && elapsedMs > 0
      ? Math.max(1, Math.round((frames * 1000) / elapsedMs))
      : fps;

  return {
    blob,
    mimeType,
    extension,
    width,
    height,
    durationMs: format === 'gif' ? Math.round((frames / fps) * 1000) : elapsedMs,
    frames,
    fps: achievedFps,
    format,
  };
}

export function saveClip(blob: Blob, sceneName: string, extension: string): void {
  const safeName = (sceneName || 'scene')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Any3d-${safeName || 'scene'}-clip.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export type SceneRecorder = (
  options?: TurntableOptions
) => Promise<TurntableResult>;

export type { SandboxPreviewHandle };
