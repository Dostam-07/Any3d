import React, { useEffect, useState } from 'react';
import { X, Bug, RotateCcw } from 'lucide-react';
import {
  isTelemetryEnabled,
  setTelemetryEnabled,
  readCounters,
  resetCounters,
  type TelemetryCounters,
} from '../lib/telemetry';

export const DebugPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [enabled, setEnabled] = useState(isTelemetryEnabled());
  const [counters, setCounters] = useState<TelemetryCounters>(readCounters());

  useEffect(() => {
    const id = window.setInterval(() => setCounters(readCounters()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const toggle = (on: boolean) => {
    setTelemetryEnabled(on);
    setEnabled(on);
    if (!on) resetCounters();
    setCounters(readCounters());
  };

  const totalEdits = Object.values(counters.editsPerProject).reduce((a, b) => a + b, 0);
  const totalExports = Object.values(counters.exportsByType).reduce((a, b) => a + b, 0);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Debug panel"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5 text-emerald-300" />
            Usage counters (on-device only)
          </p>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => toggle(e.target.checked)}
              className="accent-emerald-500"
            />
            <span>
              Opt in to anonymous on-device counters. Nothing leaves this browser.
            </span>
          </label>

          {!enabled && (
            <p className="text-[10px] text-zinc-500">
              Counters are off. Toggle on to start recording. Reset clears all data.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Scenes created" value={counters.scenesCreated} />
            <Stat label="Remix links opened" value={counters.remixLinksOpened} />
            <Stat label="Edits (all projects)" value={totalEdits} />
            <Stat label="Exports (all)" value={totalExports} />
          </div>

          {Object.keys(counters.exportsByType).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Exports by type
              </p>
              <ul className="text-[10px] font-mono text-zinc-400 space-y-0.5">
                {Object.entries(counters.exportsByType).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(counters.editsPerProject).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Edits per project
              </p>
              <ul className="text-[10px] font-mono text-zinc-400 space-y-0.5 max-h-24 overflow-y-auto">
                {Object.entries(counters.editsPerProject).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span className="truncate">{k}</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              resetCounters();
              setCounters(readCounters());
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2">
    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
    <p className="text-lg font-bold text-zinc-100 mt-0.5">{value}</p>
  </div>
);
