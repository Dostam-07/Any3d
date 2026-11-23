import type { WebPresentationSize } from '../types';

/**
 * Stamp the presentation size into a scene definition.
 *
 * The studio never rewrites live code when the presentation switches — the
 * sandbox receives a `size` message instead, so the scene keeps its camera pose
 * and never reloads. The stamp is only applied to a copy handed to the exporter,
 * because a standalone file has no toolbar to send that message.
 */
export function withPresentationSize(code: string, size: WebPresentationSize): string {
  if (!code) return code;
  if (/\bsize\s*:\s*['"][^'"]+['"]/.test(code)) {
    return code.replace(/\bsize\s*:\s*['"][^'"]+['"]/, `size: '${size}'`);
  }
  if (/\bdefineWorld\s*\(\s*\{/.test(code)) {
    return code.replace(/\bdefineWorld\s*\(\s*\{/, `defineWorld({\n  size: '${size}',`);
  }
  if (/\bAny3d\.figure\s*\(\s*\{/.test(code)) {
    return code.replace(/\bAny3d\.figure\s*\(\s*\{/, `Any3d.figure({\n  size: '${size}',`);
  }
  return code;
}
