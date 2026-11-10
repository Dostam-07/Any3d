/**
 * Minimal hash router for Any3d.
 *
 * Purpose: a "new project" must open its OWN page (its own URL), not the
 * Studio workspace. Hash routing keeps the app dependency-free while giving
 * every page a real address that supports refresh, deep links and back/forward.
 *
 *   #/                     -> home
 *   #/project/new          -> blank new-project page
 *   #/project/<sessionId>  -> an existing project page
 *   #/studio               -> the legacy Studio workspace
 *   #/s/<payload>          -> a shared scene (see lib/scene-payload.ts)
 */

export type RouteView = 'home' | 'studio' | 'project' | 'shared';

export interface Route {
  view: RouteView;
  projectId?: string;
  /** Encoded scene payload for `#/s/<payload>`. */
  share?: string;
}

export const NEW_PROJECT_ID = 'new';

export function readRoute(): Route {
  const raw = (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#\/?/, '');
  const [head, ...rest] = raw.split('/');

  if (head === 'project') {
    const id = rest.join('/').trim();
    return { view: 'project', projectId: id || NEW_PROJECT_ID };
  }
  if (head === 's' || head === 'share') {
    const share = rest.join('/').trim();
    return share ? { view: 'shared', share } : { view: 'home' };
  }
  if (head === 'studio') {
    return { view: 'studio' };
  }
  return { view: 'home' };
}

export function routeToHash(route: Route): string {
  if (route.view === 'project') {
    return `#/project/${encodeURIComponent(route.projectId || NEW_PROJECT_ID)}`;
  }
  if (route.view === 'shared') {
    return `#/s/${route.share || ''}`;
  }
  if (route.view === 'studio') {
    return '#/studio';
  }
  return '#/';
}

export function isNewProject(projectId?: string): boolean {
  return !projectId || projectId === NEW_PROJECT_ID;
}
