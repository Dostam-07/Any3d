import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, GitCompare, Undo2, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';
import { diffScene, revertHunk, hunkHeader } from '../lib/diff';

interface VersionDiffProps {
  open: boolean;
  onClose: () => void;
  /** Assistant messages that carry a code snapshot, oldest first. */
  versions: ChatMessage[];
  /** The scene currently on the stage. */
  currentCode: string;
  /** Called with the new scene text after a hunk is reverted. */
  onApply: (code: string) => void;
}

/**
 * Side-by-side version comparison with per-hunk revert.
 *
 * The dialog is portalled to `document.body`: the Studio toolbar uses
 * `backdrop-blur`, which makes an ancestor the containing block for
 * `position: fixed` and would otherwise clip the dialog.
 */
export const VersionDiff: React.FC<VersionDiffProps> = ({ open, onClose, versions, currentCode, onApply }) => {
  const [fromVersion, setFromVersion] = useState<number | null>(null);
  const [toVersion, setToVersion] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...versions].sort((a, b) => (a.version || 0) - (b.version || 0)),
    [versions]
  );

  // Default to the last two checkpoints, which is the edit people want to audit.
  useEffect(() => {
    if (!open || ordered.length < 2) return;
    setFromVersion(ordered[ordered.length - 2].version || null);
    setToVersion(ordered[ordered.length - 1].version || null);
  }, [open, ordered.length]);

  const fromMsg = ordered.find((m) => m.version === fromVersion);
  const toMsg = ordered.find((m) => m.version === toVersion);
  const fromCode = fromMsg?.codeSnapshot || '';
  const toCode = toMsg?.codeSnapshot || '';

  // Reset the working copy whenever the compared pair changes.
  useEffect(() => {
    setDraft(toCode);
    setError(null);
  }, [fromCode, toCode]);

  const diff = useMemo(() => diffScene(fromCode, draft), [fromCode, draft]);

  if (!open) return null;

  const handleRevert = (hunkId: string) => {
    const hunk = diff.hunks.find((h) => h.id === hunkId);
    if (!hunk) return;
    const next = revertHunk(draft, hunk);
    if (next === null) {
      setError('This hunk no longer matches the scene — it changed since the diff was taken.');
      return;
    }
    setError(null);
    setDraft(next);
    onApply(next);
  };

  const canCompare = ordered.length >= 2;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[86vh] flex flex-col rounded-2xl border border-white/[0.12] bg-[#0b0d15] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <GitCompare className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-sm font-semibold text-zinc-100">Compare versions</span>
            {!diff.identical && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400">
                +{diff.added} −{diff.removed}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!canCompare ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            Two checkpoints are needed to compare. Make another edit first.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#0c0e17] shrink-0">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500">From</label>
              <select
                value={fromVersion ?? ''}
                onChange={(e) => setFromVersion(Number(e.target.value))}
                className="bg-[#11141f] border border-white/[0.1] rounded-lg text-[11px] text-zinc-200 px-2 py-1 outline-none"
              >
                {ordered.map((m) => (
                  <option key={m.id} value={m.version}>
                    v{m.version}
                  </option>
                ))}
              </select>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500">To</label>
              <select
                value={toVersion ?? ''}
                onChange={(e) => setToVersion(Number(e.target.value))}
                className="bg-[#11141f] border border-white/[0.1] rounded-lg text-[11px] text-zinc-200 px-2 py-1 outline-none"
              >
                {ordered.map((m) => (
                  <option key={m.id} value={m.version}>
                    v{m.version}
                  </option>
                ))}
              </select>
              {draft !== toCode && (
                <span className="text-[10px] text-amber-300/90 font-mono">
                  edited in this dialog
                </span>
              )}
              <span className="ml-auto text-[10px] text-zinc-600 font-mono">
                {currentCode === draft ? 'stage matches' : 'stage differs'}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-amber-300 bg-amber-500/10 border-b border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex-1 overflow-auto font-mono text-[11px] leading-[1.55]">
              {diff.identical ? (
                <div className="p-8 text-center text-xs text-zinc-500 font-sans">
                  These two versions are identical.
                </div>
              ) : (
                diff.hunks.map((hunk) => (
                  <div key={hunk.id} className="border-b border-white/[0.06]">
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0e1119] sticky top-0 z-10">
                      <span className="text-[10px] text-zinc-500">{hunkHeader(hunk)}</span>
                      <button
                        onClick={() => handleRevert(hunk.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-sans font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 transition cursor-pointer"
                        title="Restore this hunk to the older version"
                      >
                        <Undo2 className="w-3 h-3" />
                        Revert this hunk
                      </button>
                    </div>
                    {hunk.lines.map((line, i) => (
                      <div
                        key={`${hunk.id}-${i}`}
                        className={
                          line.kind === 'add'
                            ? 'flex bg-emerald-500/[0.09]'
                            : line.kind === 'remove'
                            ? 'flex bg-rose-500/[0.09]'
                            : 'flex'
                        }
                      >
                        <span className="w-10 shrink-0 text-right pr-2 text-zinc-600 select-none">
                          {line.leftNo ?? ''}
                        </span>
                        <span className="w-10 shrink-0 text-right pr-2 text-zinc-600 select-none">
                          {line.rightNo ?? ''}
                        </span>
                        <span
                          className={
                            line.kind === 'add'
                              ? 'w-4 shrink-0 text-emerald-400'
                              : line.kind === 'remove'
                              ? 'w-4 shrink-0 text-rose-400'
                              : 'w-4 shrink-0 text-zinc-700'
                          }
                        >
                          {line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}
                        </span>
                        <span
                          className={
                            line.kind === 'add'
                              ? 'whitespace-pre text-emerald-200'
                              : line.kind === 'remove'
                              ? 'whitespace-pre text-rose-200/80'
                              : 'whitespace-pre text-zinc-400'
                          }
                        >
                          {line.text || ' '}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-white/[0.08] text-[10px] text-zinc-500 shrink-0">
              Reverting a hunk updates the stage immediately. It does not create a new checkpoint.
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
