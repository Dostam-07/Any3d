import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationReport } from '../types';

interface ValidationInspectorProps {
  report: ValidationReport | null;
  isOpen: boolean;
  onToggle: () => void;
}

export const ValidationInspector: React.FC<ValidationInspectorProps> = ({
  report,
  isOpen,
  onToggle,
}) => {
  if (!report) return null;

  const passCount = report.checks.filter((c) => c.ok).length;
  const totalCount = report.checks.length;
  const allPassed = passCount === totalCount;
  const passPercent = Math.round((passCount / totalCount) * 100);

  return (
    <div className="border-t border-white/[0.08] bg-[#0c0e17] transition-all">
      <button
        onClick={onToggle}
        className="w-full h-9 px-4 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 ${allPassed ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="font-semibold text-zinc-200">Deterministic Validator</span>
          <span className="font-mono text-[11px] text-zinc-500">
            ({passCount}/{totalCount} checks · {passPercent}%)
          </span>
          {report.fidelity && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              report.fidelity.score >= 80
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}>
              Fidelity {report.fidelity.score}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
              allPassed
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
            }`}
          >
            {allPassed ? 'Ready for 3D Export' : `${totalCount - passCount} Warnings`}
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-white/[0.06] space-y-2.5 max-h-64 overflow-y-auto bg-[#0a0c13] text-xs font-mono">
          {/* Prompt Fidelity Card (if present) */}
          {report.fidelity && (
            <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Prompt Fidelity Analysis</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  report.fidelity.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {report.fidelity.score}% Match
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mb-2 truncate" title={report.fidelity.summary}>
                <span className="text-zinc-500">Core Intent: </span>
                "{report.fidelity.summary}"
              </p>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {report.fidelity.primarySubject && (
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                    Subject:{' '}
                    <span className="text-emerald-300 font-bold">
                      {report.fidelity.primarySubject.found ? `✓ ${report.fidelity.primarySubject.name}` : `✗ ${report.fidelity.primarySubject.name} missing`}
                    </span>
                  </span>
                )}
                {report.fidelity.secondaryObjects && report.fidelity.secondaryObjects.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                    Props:{' '}
                    <span className="text-zinc-200">
                      {report.fidelity.secondaryObjects
                        .map((o) => (o.found ? o.name : `${o.name} (missing)`))
                        .join(', ')}
                    </span>
                  </span>
                )}
                {report.fidelity.unrelatedObjects && report.fidelity.unrelatedObjects.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">
                    Unrelated: <span className="text-amber-300">{report.fidelity.unrelatedObjects.join(', ')}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Grid of 12 Deterministic Structural Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.checks.map((check) => (
              <div
                key={check.id}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition ${
                  check.ok
                    ? 'bg-white/[0.02] border-white/[0.06] text-zinc-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                }`}
              >
                {check.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[11px] tracking-wider text-zinc-200">
                      {check.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">#{check.id}</span>
                  </div>
                  {check.message && (
                    <p className="text-[11px] mt-0.5 text-zinc-400 truncate" title={check.message}>
                      {check.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

