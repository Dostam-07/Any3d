import React, { useRef, useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, Code2, Sparkles, FileCode } from 'lucide-react';
import { RenderFormat } from '../types';

interface CodeEditorProps {
  code: string;
  setCode: (c: string) => void;
  format: RenderFormat;
  onReset: () => void;
  linesCount: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  format,
  onReset,
  linesCount,
}) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sync line numbers scroll with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Support Tab key indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);

      // Restore cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lines = Array.from({ length: Math.max(1, linesCount) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-[#0a0c13] border-r border-white/[0.08] relative select-none">
      {/* Editor Header Bar */}
      <div className="h-10 px-3.5 border-b border-white/[0.08] bg-[#0d0f18] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-300 font-mono text-[11px]">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-zinc-100">scene.js</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
            {linesCount} lines · utf-8
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            title="Reset code to last loaded preset"
            className="p-1 hover:text-zinc-200 text-zinc-500 rounded-md hover:bg-white/[0.06] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title="Copy scene code to clipboard"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body with Gutter */}
      <div className="relative flex-1 overflow-hidden flex font-mono text-[12px] leading-[20px]">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 py-3 pr-3 text-right bg-[#090a10] border-r border-white/[0.04] text-zinc-600 select-none overflow-hidden shrink-0 pointer-events-none"
        >
          {lines.map((num) => (
            <div key={num} className="h-[20px] leading-[20px] text-[11px]">
              {num}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 h-full py-3 px-4 font-mono text-[12.5px] leading-[20px] bg-[#0c0e17] text-zinc-200 resize-none focus:outline-none selection:bg-indigo-600/30 selection:text-white tab-2 overflow-y-auto"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};

