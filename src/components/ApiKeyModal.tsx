import React, { useState } from 'react';
import { X, Key, Check, Server, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  ollamaHost: string;
  onSaveOllamaHost: (host: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  ollamaHost,
  onSaveOllamaHost,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [hostInput, setHostInput] = useState(ollamaHost);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onSaveOllamaHost(hostInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#0e101a] border border-white/[0.08] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-indigo-950/40">
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-[#0a0c13]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-white">AI Engine Connection</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI engine settings"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-sm bg-[#0c0e17]">
          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gemini-api-key" className="text-xs font-semibold text-zinc-200">Google Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              id="gemini-api-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#121422] border border-white/[0.08] focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono transition"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Stored exclusively in your local browser storage. Never transmitted to third parties.
            </p>
          </div>

          {/* Ollama Local Host */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="ollama-host-url" className="text-xs font-semibold text-zinc-200">Ollama Host URL</label>
              <span className="text-[11px] text-zinc-500 font-mono">http://localhost:11434</span>
            </div>
            <div className="relative">
              <Server className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
              <input
                id="ollama-host-url"
                type="text"
                value={hostInput}
                onChange={(e) => setHostInput(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-[#121422] border border-white/[0.08] focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono transition"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Connects to your local Ollama daemon for 100% offline generation with zero network access.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0a0c13] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-white" /> : null}
            <span>{saved ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
