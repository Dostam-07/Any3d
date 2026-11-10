import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, X, Key, Server, Eye, Code2, Columns, ShieldCheck } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, SceneSession } from './components/Sidebar';
import { Homepage } from './components/Homepage';
import { CodeEditor } from './components/CodeEditor';
import { SandboxPreview, SandboxPreviewHandle } from './components/SandboxPreview';
import { ClipControl } from './components/ClipControl';
import { StoryboardControl } from './components/StoryboardControl';
import { PaletteFromPhoto } from './components/PaletteFromPhoto';
import { DebugPanel } from './components/DebugPanel';
import { countSceneCreated, countEdit, countExport, countRemixOpened } from './lib/telemetry';
import { DEFAULT_LOOK, normalizeLook, type SceneLook } from './lib/look';
import { ValidationInspector } from './components/ValidationInspector';
import { PresetGallery } from './components/PresetGallery';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ConversationPanel } from './components/ConversationPanel';
import { ProjectPage } from './components/ProjectPage';
import { Route, readRoute, routeToHash, NEW_PROJECT_ID, isNewProject } from './lib/router';
import { decodeScene } from './lib/scene-payload';
import {
  RenderFormat,
  LLMProvider,
  PresetScene,
  ValidationReport,
  OllamaModelInfo,
  ChatMessage,
  SlashCommandType,
} from './types';
import {
  fetchPresets,
  validateCode,
  bundleCode,
  fetchOllamaModels,
  generateAny3d,
  enhancePromptApi,
  mutateSceneApi,
  askSceneApi,
} from './lib/api';
import { VersionDiff } from './components/VersionDiff';

/**
 * A chat is a chat: a message inside a conversation EDITS the scene that is
 * already on screen (add / remove / change / delete). It must never quietly
 * start a new generation, because that throws the user's work away and looks
 * like "a new chat that shows the same thing again".
 *
 * Only explicit "start over / new scene" phrasing regenerates, and even then it
 * stays in the same project conversation.
 */
function isExplicitNewScene(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;

  const NEW_SCENE_PATTERNS: RegExp[] = [
    /\b(new|another|different|fresh|separate)\s+(scene|project|world)\b/i,
    /\b(start\s+over|start\s+again|from\s+scratch|reset\s+(the\s+)?scene|scrap\s+(this|it)|forget\s+(this|it))\b/i,
    /^(?:create|build|generate|design|draw|paint|make|show)\s+(?:me\s+)?(?:a|an)\s+(?:brand\s+new|completely\s+new|entirely\s+new|whole\s+new)\b/i,
  ];
  return NEW_SCENE_PATTERNS.some((re) => re.test(t));
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('any3d_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {
      // Storage can be unavailable in private browsing; keep the OS preference.
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [format, setFormat] = useState<RenderFormat>('svg');
  const [provider, setProvider] = useState<LLMProvider>('ollama');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');
  const [ollamaModel, setOllamaModel] = useState<string>('qwen2.5-coder:1.5b');
  const [ollamaHost, setOllamaHost] = useState<string>(
    () => localStorage.getItem('any3d_ollama_host') || 'http://localhost:11434'
  );
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem('any3d_gemini_key') || ''
  );
  const [size, setSize] = useState<'hero' | 'card' | 'mini'>('card');
  const [prompt, setPrompt] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [presets, setPresets] = useState<PresetScene[]>([]);
  const [currentPresetId, setCurrentPresetId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [currentBundledHtml, setCurrentBundledHtml] = useState<string>('');
  const [validation, setValidation] = useState<ValidationReport | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancedNotice, setEnhancedNotice] = useState<{ wordsAdded: number; previousPrompt: string } | null>(null);
  const [isBundling, setIsBundling] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingGlb, setIsExportingGlb] = useState<boolean>(false);
  const previewRef = useRef<SandboxPreviewHandle>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModelInfo[]>([]);
  const [stageView, setStageView] = useState<'preview' | 'code' | 'split'>('preview');
  const [stageLook, setStageLook] = useState<SceneLook>(DEFAULT_LOOK);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem('any3d_theme', theme);
    } catch {
      // The selected theme remains active for this page even without storage.
    }
  }, [theme]);

  // Navigation & View Architecture (URL-backed, so every page has its own address):
  //   #/            -> home (landing page with prompt & inspirations)
  //   #/project/:id -> dedicated project page: chat-first, opened when a project starts
  //   #/studio      -> legacy Studio workspace (canvas + code editor + inspector)
  const [route, setRoute] = useState<Route>(() => readRoute());
  const activeView = route.view;
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    window.matchMedia('(min-width: 1024px)').matches
  );

  const go = useCallback((next: Route, replace = false) => {
    const hash = routeToHash(next);
    if (typeof window !== 'undefined' && window.location.hash !== hash) {
      if (replace) window.history.replaceState(null, '', hash);
      else window.history.pushState(null, '', hash);
    }
    setRoute(next);
  }, []);

  // Opening a shared link runs third-party scene code, so it needs one explicit yes.
  const [approvedShare, setApprovedShare] = useState<string | null>(null);
  const isShareApproved = route.view === 'shared' && !!route.share && approvedShare === route.share;

  const goHome = useCallback(() => go({ view: 'home' }), [go]);
  const goStudio = useCallback(() => go({ view: 'studio' }), [go]);
  const openProject = useCallback(
    (projectId: string, replace = false) => go({ view: 'project', projectId }, replace),
    [go]
  );

  // A brand-new project always opens its own page, never the Studio.
  const startNewProject = useCallback(() => {
    setCurrentSessionId('');
    setMessages([]);
    setCode('');
    setCurrentBundledHtml('');
    setCurrentPresetId('');
    setPrompt('');
    setValidation(null);
    setErrorMessage(null);
    openProject(NEW_PROJECT_ID);
  }, [openProject]);

  // Keep the URL and the view in sync on back/forward.
  useEffect(() => {
    const onRouteChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);
    return () => {
      window.removeEventListener('hashchange', onRouteChange);
      window.removeEventListener('popstate', onRouteChange);
    };
  }, []);

  // A direct visit to #/project/new must start a blank project — never restore
  // the previous conversation on top of it.
  const [isBlankProjectStart] = useState<boolean>(() => {
    const initial = readRoute();
    return initial.view === 'project' && isNewProject(initial.projectId);
  });

  // Multi-Scene Sessions History (persisted)
  const [sessions, setSessions] = useState<SceneSession[]>(() => {
    try {
      const saved = localStorage.getItem('any3d_saved_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    isBlankProjectStart ? '' : 'sess-default'
  );

  // Agent Chat & Conversation History state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (isBlankProjectStart) return [];
    try {
      const saved = localStorage.getItem('any3d_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [isProcessingChat, setIsProcessingChat] = useState<boolean>(false);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('any3d_saved_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('any3d_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
  }, [messages]);

  // Deep links: opening / reloading #/project/<id> loads that project into the page.
  useEffect(() => {
    if (route.view !== 'project') return;
    const id = route.projectId;
    if (!id || isNewProject(id) || id === currentSessionId) return;
    const sess = sessions.find((s) => s.id === id);
    if (!sess) return;
    setCurrentSessionId(sess.id);
    setFormat(sess.format);
    setCode(sess.code);
    setMessages(sess.messages || []);
    setStageView('preview');
    bundleCode(sess.code, sess.format)
      .then((b) => setCurrentBundledHtml(b.html))
      .catch((e) => console.warn('Deep link bundle error', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.view, route.projectId, sessions]);

  // Arriving at #/project/new by any route (deep link, back/forward, hash change)
  // always means a clean slate — never the previously open project's transcript.
  useEffect(() => {
    if (route.view !== 'project' || !isNewProject(route.projectId)) return;
    setCurrentSessionId('');
    setMessages([]);
    setCode('');
    setCurrentBundledHtml('');
    setCurrentPresetId('');
    setPrompt('');
    setValidation(null);
  }, [route.view, route.projectId]);

  // Shared scenes (#/s/<payload>): decode the payload and open it as an UNSAVED
  // project, so a link never overwrites the recipient's own work.
  useEffect(() => {
    if (route.view !== 'shared' || !route.share || approvedShare !== route.share) return;
    countRemixOpened();
    let cancelled = false;

    (async () => {
      try {
        const payload = await decodeScene(route.share as string);
        if (cancelled) return;
        setErrorMessage(null);
        setFormat(payload.format);
        setCode(payload.code);
        setPrompt(payload.prompt || '');
        setCurrentPresetId('');
        setCurrentSessionId('');
        setStageView('preview');
        setMessages(
          payload.prompt
            ? [
                {
                  id: `shared-${Date.now()}-u`,
                  role: 'user',
                  content: payload.prompt,
                  timestamp: Date.now(),
                  format: payload.format,
                },
              ]
            : []
        );
        // A link shared at dusk opens at dusk: the look rides with the payload.
        const sharedLook = normalizeLook(payload.look);
        setStageLook(sharedLook);
        const bundled = await bundleCode(payload.code, payload.format, sharedLook);
        if (cancelled) return;
        setCurrentBundledHtml(bundled.html);
        validateCode(payload.code, payload.format, payload.prompt)
          .then((report) => { if (!cancelled) setValidation(report); })
          .catch(() => undefined);
      } catch (err: any) {
        if (cancelled) return;
        setErrorMessage(err?.message || 'This scene link could not be opened');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route.view, route.share, approvedShare]);

  // Keep the active project's history entry in sync with the live conversation,
  // so a project opened from Home keeps its transcript when revisited.
  useEffect(() => {
    if (!currentSessionId) return;
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === currentSessionId);
      if (idx < 0) return prev;
      const firstUser = messages.find((m) => m.role === 'user');
      const title = prev[idx].title || firstUser?.content.slice(0, 36) || 'Untitled project';
      const updated: SceneSession = {
        ...prev[idx],
        title,
        format,
        code: code || prev[idx].code,
        messages,
        updatedAt: Date.now(),
      };
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  }, [currentSessionId, messages, code, format]);

  // Global Keyboard Shortcuts (Ctrl+B = Sidebar, Ctrl+N = New Scene/Home, Ctrl+J = Chat, Ctrl+K = Presets, Ctrl+I = Inspector)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        startNewProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGalleryOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDebugOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Load presets and Ollama models on mount. A scene is only loaded by an
  // explicit prompt, restored project, or preset selection.
  useEffect(() => {
    fetchPresets().then((data) => {
      setPresets(data);
    });

    fetchOllamaModels(ollamaHost).then((models) => {
      setOllamaModels(models);
      if (models.length > 0) {
        const chatModels = models.filter((m) => !m.name.includes('embed'));
        // Keep the fast default for scene generation; edits go through a compact
        // edit plan, so they stay quick even on a small model. Users can pick a
        // bigger model from the project toolbar when they want deeper changes.
        const lightweightCoder = chatModels.find(
          (m) => m.name.includes('coder') && (m.name.includes('1.5b') || (m.size && m.size < 2.5e9))
        );
        const anyLightweight = chatModels.find((m) => m.size && m.size < 2.5e9);
        const chosen = lightweightCoder?.name || anyLightweight?.name || chatModels[0]?.name || models[0].name;
        setOllamaModel(chosen);
        if (!localStorage.getItem('any3d_gemini_key')) {
          setProvider('ollama');
        }
      }
    });
  }, []);

  // Update validation whenever code or format changes
  useEffect(() => {
    if (!code) return;
    validateCode(code, format, prompt)
      .then((rep) => setValidation(rep))
      .catch((e) => console.error(e));
  }, [code, format, prompt]);

  // Bundle code into standalone HTML
  const refreshSandbox = useCallback(async () => {
    if (!code) return;
    setIsBundling(true);
    try {
      const res = await bundleCode(code, format);
      setCurrentBundledHtml(res.html);
    } catch (err) {
      console.error('Bundling error:', err);
    } finally {
      setIsBundling(false);
    }
  }, [code, format]);

  // Debounced auto-refresh when code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshSandbox();
    }, 400);
    return () => clearTimeout(timer);
  }, [code, format, refreshSandbox]);

  // When engine format switches, switch to an appropriate preset and record checkpoint
  const handleFormatChange = (newFormat: RenderFormat) => {
    setFormat(newFormat);
    const candidate = presets.find((p) => p.format === newFormat);
    if (candidate) {
      setCurrentPresetId(candidate.id);
      setCode(candidate.code);
      bundleCode(candidate.code, newFormat)
        .then((b) => setCurrentBundledHtml(b.html))
        .catch((e) => console.warn('Format change bundle error', e));
      const nextVer = (messages.filter((m) => m.role === 'assistant' && m.version).length || 0) + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-u`,
          role: 'user',
          content: `Switch engine format to ${newFormat.toUpperCase()}`,
          timestamp: Date.now(),
          format: newFormat,
        },
        {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: `Switched engine format to ${newFormat.toUpperCase()} and loaded starter scene (v${nextVer})`,
          timestamp: Date.now(),
          codeSnapshot: candidate.code,
          format: newFormat,
          version: nextVer,
          summary: `Switched to ${newFormat.toUpperCase()}`,
        },
      ]);
    }
  };

  // Session Sync Helper
  const syncSession = useCallback(
    (title: string, sessionCode: string, sessionFormat: RenderFormat, sessionMsgs: ChatMessage[]) => {
      const activeId = currentSessionId || `sess-${Date.now()}`;
      setCurrentSessionId(activeId);
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === activeId);
        const updated: SceneSession = {
          id: activeId,
          title: title.slice(0, 36) || 'Untitled Scene',
          format: sessionFormat,
          updatedAt: Date.now(),
          messages: sessionMsgs,
          code: sessionCode,
        };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [updated, ...prev];
      });
    },
    [currentSessionId]
  );

  const handleSelectSession = (sess: SceneSession) => {
    setCurrentSessionId(sess.id);
    setFormat(sess.format);
    setCode(sess.code);
    setMessages(sess.messages || []);
    setStageView('preview');
    // Opening a project always lands on its own page, not the Studio.
    openProject(sess.id);
    bundleCode(sess.code, sess.format)
      .then((b) => setCurrentBundledHtml(b.html))
      .catch((e) => console.warn('Select session bundle error', e));
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId('');
    }
  };

  // "New project" entry point (sidebar CTA / Ctrl+N): opens the blank project page.
  const handleNewScene = () => {
    startNewProject();
  };

  const handleStartSceneFromHome = async (
    promptText: string,
    targetFormat: RenderFormat,
    targetSize: 'hero' | 'card' | 'mini'
  ) => {
    const newSessId = `sess-${Date.now()}`;
    const startedAt = Date.now();

    setPrompt(promptText);
    setFormat(targetFormat);
    setSize(targetSize);
    setCurrentPresetId('');
    setErrorMessage(null);

    // 1. Open the project's own page immediately, with the prompt already in the transcript.
    const userMsg: ChatMessage = {
      id: `${newSessId}-u`,
      role: 'user',
      content: promptText,
      timestamp: startedAt,
      format: targetFormat,
    };
    setCurrentSessionId(newSessId);
    setMessages([userMsg]);
    setCode('');
    setCurrentBundledHtml('');
    setValidation(null);
    setSessions((prev) => [
      {
        id: newSessId,
        title: promptText.slice(0, 36),
        format: targetFormat,
        updatedAt: startedAt,
        messages: [userMsg],
        code: '',
      },
      ...prev,
    ]);
    openProject(newSessId);

    // 2. Then generate into that page.
    setIsGenerating(true);

    try {
      const res = await generateAny3d({
        provider,
        geminiModel,
        ollamaModel,
        ollamaHost,
        apiKey,
        format: targetFormat,
        size: targetSize,
        prompt: promptText,
        seed: seedLocked ? seed : undefined,
      });

      setCode(res.code);
      setValidation(res.validation);
      setCurrentPresetId('');
      countSceneCreated();
      setStageView('preview');
      try {
        const bundled = await bundleCode(res.code, targetFormat);
        setCurrentBundledHtml(bundled.html);
      } catch (bundleErr) {
        console.warn('Initial bundle warning', bundleErr);
      }

      const newMsgs: ChatMessage[] = [
        userMsg,
        {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: `Generated ${targetFormat.toUpperCase()} scene for "${promptText}" (v1)`,
          timestamp: Date.now(),
          codeSnapshot: res.code,
          format: targetFormat,
          version: 1,
          summary: `Created ${targetFormat} scene: ${promptText.slice(0, 45)}`,
        },
      ];
      setMessages(newMsgs);

      const newSession: SceneSession = {
        id: newSessId,
        title: promptText.slice(0, 36),
        format: targetFormat,
        updatedAt: Date.now(),
        messages: newMsgs,
        code: res.code,
      };
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === newSessId);
        if (idx < 0) return [newSession, ...prev];
        const copy = [...prev];
        copy[idx] = newSession;
        return copy;
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhancePromptText = async (promptText: string): Promise<string> => {
    const res = await enhancePromptApi({
      prompt: promptText,
      format,
      provider,
      geminiModel,
      ollamaModel,
      ollamaHost,
      apiKey,
    });
    return res.enhanced;
  };

  // Select Preset and record checkpoint in conversation history
  const handleSelectPreset = (preset: PresetScene) => {
    setFormat(preset.format);
    setCurrentPresetId(preset.id);
    setCode(preset.code);
    goStudio();
    setStageView('preview');
    bundleCode(preset.code, preset.format)
      .then((b) => setCurrentBundledHtml(b.html))
      .catch((e) => console.warn('Preset bundle error', e));

    const nextVer = (messages.filter((m) => m.role === 'assistant' && m.version).length || 0) + 1;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: `Load preset: ${preset.title}`,
      timestamp: Date.now(),
      format: preset.format,
    };
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: `Loaded ${preset.format.toUpperCase()} preset "${preset.title}" (v${nextVer})`,
      timestamp: Date.now(),
      codeSnapshot: preset.code,
      format: preset.format,
      version: nextVer,
      summary: `Preset: ${preset.title}`,
    };
    const updatedMsgs = [...messages, userMsg, assistantMsg];
    setMessages(updatedMsgs);
    syncSession(preset.title, preset.code, preset.format, updatedMsgs);
  };

  // Remix: start a brand-new project from a preset, with the scene as version 1.
  const handleRemixPreset = (preset: PresetScene) => {
    const newSessId = `sess-${Date.now()}`;
    const startedAt = Date.now();
    const title = `Remix · ${preset.title}`;
    setFormat(preset.format);
    setCurrentPresetId(preset.id);
    setCode(preset.code);
    setCurrentBundledHtml('');
    setValidation(null);
    setPrompt('');
    const userMsg: ChatMessage = {
      id: `${newSessId}-u`,
      role: 'user',
      content: `Remix: ${preset.title}`,
      timestamp: startedAt,
      format: preset.format,
    };
    const assistantMsg: ChatMessage = {
      id: `${newSessId}-a`,
      role: 'assistant',
      content: `Started a new project from "${preset.title}".`,
      timestamp: startedAt + 1,
      codeSnapshot: preset.code,
      format: preset.format,
      version: 1,
      summary: `Preset: ${preset.title}`,
    };
    setCurrentSessionId(newSessId);
    setMessages([userMsg, assistantMsg]);
    setSessions((prev) => [
      {
        id: newSessId,
        title,
        format: preset.format,
        updatedAt: startedAt,
        messages: [userMsg, assistantMsg],
        code: preset.code,
      },
      ...prev,
    ]);
    countSceneCreated();
    openProject(newSessId);
    bundleCode(preset.code, preset.format)
      .then((b) => setCurrentBundledHtml(b.html))
      .catch((e) => console.warn('Remix bundle error', e));
  };

  // Reset to current preset
  const handleResetCode = () => {
    const p = presets.find((p) => p.id === currentPresetId);
    if (p) setCode(p.code);
  };

  // Save Settings
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('any3d_gemini_key', key);
  };

  const handleSaveOllamaHost = (host: string) => {
    setOllamaHost(host);
    localStorage.setItem('any3d_ollama_host', host);
    fetchOllamaModels(host).then((models) => setOllamaModels(models));
  };

  // Generate Scene
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (provider === 'gemini' && !apiKey.trim()) {
      setErrorMessage(
        'A Google Gemini API key is required to generate with Gemini. Please paste your key or switch to Ollama (Local) for offline generation.'
      );
      setIsApiKeyOpen(true);
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    try {
      const res = await generateAny3d({
        provider,
        geminiModel,
        ollamaModel,
        ollamaHost,
        apiKey,
        format,
        size,
        prompt,
        seed: seedLocked ? seed : undefined,
      });

      setCode(res.code);
      setValidation(res.validation);
      setCurrentPresetId('');
      countSceneCreated();
      setStageView('preview');
      try {
        const bundled = await bundleCode(res.code, format);
        setCurrentBundledHtml(bundled.html);
      } catch (bundleErr) {
        console.warn('Initial bundle warning', bundleErr);
      }

      // Add to conversational history with version snapshot
      const nextVer = (messages.filter((m) => m.role === 'assistant' && m.version).length || 0) + 1;
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-u`,
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
        format,
      };
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: `Generated ${format.toUpperCase()} scene for "${prompt}" (v${nextVer})`,
        timestamp: Date.now(),
        codeSnapshot: res.code,
        format,
        version: nextVer,
        seed: seedLocked ? seed : undefined,
        summary: `Created ${format} scene: ${prompt.slice(0, 45)}`,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Conversational Code Mutation & Slash Command Handler
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessingChat) return;

    // Direct slash utility commands
    if (trimmed === '/clear') {
      handleClearHistory();
      return;
    }
    if (trimmed === '/glb') {
      await handleExportGlb();
      return;
    }
    if (trimmed === '/html') {
      await handleExportHtml();
      return;
    }

    // Atmosphere is a client-side look change: it works on every engine and
    // costs no model call. Only short, unambiguous commands take this path.
    const lookIntent = trimmed.match(
      /^(?:make it|set it to|switch to|go)\s+(night|dusk|dawn|noon|day|evening|rain|snow)\b/i
    );
    if (lookIntent) {
      const word = lookIntent[1].toLowerCase();
      const at =
        word === 'dawn'
          ? 0
          : word === 'noon' || word === 'day'
            ? 1 / 3
            : word === 'dusk'
              ? 2 / 3
              : word === 'evening'
                ? 0.8
                : 1;
      const next: SceneLook =
        word === 'rain' || word === 'snow'
          ? { ...stageLook, weather: word as SceneLook['weather'] }
          : { ...stageLook, timeOfDay: at };
      setStageLook(next);
      const stamp = Date.now();
      const userMsg: ChatMessage = {
        id: `msg-${stamp}-u`,
        role: 'user',
        content: trimmed,
        timestamp: stamp,
        format,
      };
      const note: ChatMessage = {
        id: `msg-${stamp}-a`,
        role: 'assistant',
        content:
          word === 'rain' || word === 'snow'
            ? `Set the weather to ${word}. This is a live look change — no code was regenerated.`
            : `Set the scene to ${word}. This is a live look change — no code was regenerated.`,
        timestamp: stamp + 1,
        format,
        summary: `Atmosphere: ${word}`,
      };
      setMessages((prev) => [...prev, userMsg, note]);
      return;
    }
    if (trimmed === '/undo') {
      const assistantMsgs = messages.filter((m) => m.role === 'assistant' && m.codeSnapshot);
      if (assistantMsgs.length >= 2) {
        const prev = assistantMsgs[assistantMsgs.length - 2];
        handleRestoreVersion(prev);
      } else {
        const stamp = Date.now();
        const userMsg: ChatMessage = {
          id: `msg-${stamp}-u`,
          role: 'user',
          content: trimmed,
          timestamp: stamp,
          format,
        };
        const note: ChatMessage = {
          id: `msg-${stamp}-a`,
          role: 'assistant',
          content:
            'There is no earlier version to undo — this is the first checkpoint. Make a change and try /undo again.',
          timestamp: stamp + 1,
          format,
          summary: 'Undo: nothing earlier',
        };
        setMessages((prev) => [...prev, userMsg, note]);
      }
      return;
    }
    if (trimmed.startsWith('/enhance')) {
      const pToEnhance = trimmed.replace(/^\/enhance\s*/, '') || prompt;
      if (pToEnhance) {
        setIsProcessingChat(true);
        try {
          const res = await enhancePromptApi({
            prompt: pToEnhance,
            format,
            provider,
            geminiModel,
            ollamaModel,
            ollamaHost,
            apiKey,
          });
          setPrompt(res.enhanced);
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}-u`,
              role: 'user',
              content: trimmed,
              command: '/enhance',
              timestamp: Date.now(),
              format,
            },
            {
              id: `msg-${Date.now()}-a`,
              role: 'assistant',
              content: `✨ Enhanced Prompt:\n\n"${res.enhanced}"\n\n(Added ${res.wordsAdded} words of architectural detail)`,
              timestamp: Date.now(),
              format,
              summary: 'Enhanced prompt',
            },
          ]);
        } catch (e: any) {
          setErrorMessage(e.message || 'Failed to enhance prompt');
        } finally {
          setIsProcessingChat(false);
        }
      }
      return;
    }

    let targetFormat = format;
    let instruction = trimmed;
    let commandUsed: SlashCommandType | undefined;

    // Parse format slash commands (/svg, /worlds, /world, /pixel, /dither)
    if (/^\/svg\s*/i.test(trimmed)) {
      targetFormat = 'svg';
      instruction = trimmed.replace(/^\/svg\s*/i, '');
      commandUsed = '/svg';
      setFormat('svg');
    } else if (/^\/(?:worlds|world)\s*/i.test(trimmed)) {
      targetFormat = 'worlds';
      instruction = trimmed.replace(/^\/(?:worlds|world)\s*/i, '');
      commandUsed = '/worlds';
      setFormat('worlds');
    } else if (/^\/pixel\s*/i.test(trimmed)) {
      targetFormat = 'pixel';
      instruction = trimmed.replace(/^\/pixel\s*/i, '');
      commandUsed = '/pixel';
      setFormat('pixel');
    } else if (/^\/dither\s*/i.test(trimmed)) {
      targetFormat = 'dither';
      instruction = trimmed.replace(/^\/dither\s*/i, '');
      commandUsed = '/dither';
      setFormat('dither');
    }

    if (!instruction.trim()) {
      return;
    }

    // A blank project page (#/project/new) turns into a real project on first send.
    // A blank project page (#/project/new) or an opened shared scene (#/s/...) turns
    // into a real local project on first send — the source it came from is untouched.
    const needsLocalSession =
      route.view === 'shared' || (route.view === 'project' && isNewProject(route.projectId));
    if (needsLocalSession && !currentSessionId) {
      const id = `sess-${Date.now()}`;
      setCurrentSessionId(id);
      openProject(id, true);
      setSessions((prev) => [
        {
          id,
          title: instruction.slice(0, 36),
          format: targetFormat,
          updatedAt: Date.now(),
          messages: [],
          code: '',
        },
        ...prev,
      ]);
    }

    const nextVer = (messages.filter((m) => m.role === 'assistant' && m.version).length || 0) + 1;

    // Append user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: trimmed,
      command: commandUsed,
      timestamp: Date.now(),
      format: targetFormat,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessingChat(true);
    setErrorMessage(null);

    try {
      // Detect current code engine format
      const currentCodeEngine: RenderFormat = /\bdefineWorld\b/.test(code)
        ? 'worlds'
        : /\bPixel\.scene\b/.test(code)
        ? (/\bbayer\s*:|\bshadow\s*:\s*['"]hard['"]/.test(code) ? 'dither' : 'pixel')
        : 'svg';

      // Inside a conversation the default is to EDIT what is on screen. A brand-new
      // generation only happens when there is nothing to edit, the engine changed,
      // a slash command asked for it, or the user explicitly asked for a new scene.
      const isNewGen =
        !code.trim() ||
        commandUsed !== undefined ||
        currentCodeEngine !== targetFormat ||
        isExplicitNewScene(instruction);

      if (isNewGen) {
        setPrompt(instruction);
        const res = await generateAny3d({
          provider,
          geminiModel,
          ollamaModel,
          ollamaHost,
          apiKey,
          format: targetFormat,
          size,
          prompt: instruction,
          seed: seedLocked ? seed : undefined,
        });

        setCode(res.code);
        setValidation(res.validation);
        setCurrentPresetId('');
        setStageView('preview');
        countSceneCreated();
        try {
          const bundled = await bundleCode(res.code, targetFormat);
          setCurrentBundledHtml(bundled.html);
        } catch (bundleErr) {
          console.warn('Bundle error', bundleErr);
        }

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: `Generated ${targetFormat.toUpperCase()} scene for "${instruction}" (v${nextVer})`,
          timestamp: Date.now(),
          codeSnapshot: res.code,
          format: targetFormat,
          version: nextVer,
          seed: seedLocked ? seed : undefined,
          summary: `Created ${targetFormat} scene: ${instruction.slice(0, 45)}`,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Conversational Mutation of current scene — stays in this same conversation.
        const res = await mutateSceneApi({
          code,
          format: targetFormat,
          instruction,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          provider,
          geminiModel,
          ollamaModel,
          ollamaHost,
          apiKey,
        });

        const didChange = res.changed !== false && res.code !== code;

        if (didChange) {
          setCode(res.code);
          setValidation(res.validation);
          setCurrentPresetId('');
          setStageView('preview');
          countEdit(currentSessionId || 'unknown');
          try {
            const bundled = await bundleCode(res.code, targetFormat);
            setCurrentBundledHtml(bundled.html);
          } catch (bundleErr) {
            console.warn('Bundle error', bundleErr);
          }
        }

        // Never claim a change that did not happen — that is what made edits look
        // like they "showed the same thing again".
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: didChange
            ? res.summary || `Updated the scene: ${instruction}`
            : res.summary || `I could not apply that change to this scene.`,
          timestamp: Date.now(),
          codeSnapshot: didChange ? res.code : undefined,
          format: targetFormat,
          version: didChange ? nextVer : undefined,
          seed: didChange && seedLocked ? seed : undefined,
          summary: didChange ? res.summary || instruction : 'No change applied',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `Error: ${err.message || 'Operation failed'}`,
        timestamp: Date.now(),
        format: targetFormat,
      };
      setMessages((prev) => [...prev, errMsg]);
      setErrorMessage(err.message || 'Chat operation failed');
    } finally {
      setIsProcessingChat(false);
    }
  };

  // Phase 4 — Trust. Seed lock, read-only Ask mode, and the version diff dialog.
  // A locked seed is sent with generation and stored on the version it produced.
  const [seedLocked, setSeedLocked] = useState(false);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 100000));
  const [askSceneEnabled, setAskSceneEnabled] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  const handleRestoreVersion = (msg: ChatMessage) => {
    if (msg.codeSnapshot) {
      setCode(msg.codeSnapshot);
      if (msg.format) {
        setFormat(msg.format);
      }
      if (typeof msg.seed === 'number') {
        setSeed(msg.seed);
      }
    }
  };

  /**
   * Ask about the scene: read-only. It appends a message and never touches code,
   * validation or version numbers, so it cannot create a checkpoint.
   */
  const handleAskScene = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isProcessingChat) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-q`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      format,
      kind: 'ask',
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessingChat(true);
    setErrorMessage(null);
    try {
      const res = await askSceneApi({
        code,
        question: trimmed,
        format,
        validation,
        provider,
        geminiModel,
        ollamaModel,
        ollamaHost,
        apiKey,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-ans`,
          role: 'assistant',
          content: res.answer,
          timestamp: Date.now(),
          format,
          kind: 'ask',
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-anserr`,
          role: 'assistant',
          content: `I could not answer that: ${err.message || 'request failed'}`,
          timestamp: Date.now(),
          format,
          kind: 'ask',
        },
      ]);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('any3d_chat_history');
  };

  // Enhance Prompt exponentially (usable from PromptBar, ConversationPanel, or Homepage)
  const handleEnhancePrompt = async (textToEnhance?: string): Promise<string | void> => {
    const targetText = (typeof textToEnhance === 'string' ? textToEnhance : prompt).trim();
    if (!targetText || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const prev = targetText;
      const res = await enhancePromptApi({
        prompt: targetText,
        format,
        provider,
        geminiModel,
        ollamaModel,
        ollamaHost,
        apiKey,
      });
      // If called without explicit argument (from top PromptBar), update prompt state and notice
      if (typeof textToEnhance !== 'string') {
        setPrompt(res.enhanced);
        setEnhancedNotice({ wordsAdded: res.wordsAdded, previousPrompt: prev });
      }
      return res.enhanced;
    } catch (err: any) {
      setErrorMessage(err.message || 'Prompt enhancement failed');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoEnhance = () => {
    if (enhancedNotice?.previousPrompt) {
      setPrompt(enhancedNotice.previousPrompt);
      setEnhancedNotice(null);
    }
  };

  // Export Standalone HTML
  const handleExportHtml = async () => {
    setIsExporting(true);
    countExport('html');
    try {
      // The exported file carries the atmosphere the user is looking at, so it
      // reopens at dusk even when opened straight from disk.
      const res = await bundleCode(code, format, format === 'svg' ? stageLook : null);
      const blob = new Blob([res.html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Any3d-${validation?.name || format + '-scene'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export Error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGlb = async () => {
    if (!previewRef.current) return;
    setIsExportingGlb(true);
    countExport('glb');
    try {
      await previewRef.current.exportGlb();
    } catch (err: any) {
      alert(`GLB Export Error: ${err.message}`);
    } finally {
      setIsExportingGlb(false);
    }
  };

  const lineCount = code ? code.split('\n').length : 0;
  const isValid = validation ? validation.valid : true;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#090b11] text-zinc-100">
      {/* ChatGPT / Claude-style Collapsible Left Sidebar */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewScene={handleNewScene}
        onDeleteSession={handleDeleteSession}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenSettings={() => setIsApiKeyOpen(true)}
        presetsCount={presets.length}
        provider={provider}
        currentModelName={provider === 'gemini' ? geminiModel : (ollamaModel || 'Ollama')}
        hasApiKey={Boolean(apiKey)}
        activeView={activeView}
        onNavigateHome={goHome}
      />

      {/* Main Display Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Error / Alert Banner */}
        {errorMessage && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200 animate-fade-in shrink-0 z-50">
            <div className="flex items-center gap-2 overflow-hidden">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {provider === 'gemini' && !apiKey && (
                <button
                  onClick={() => setIsApiKeyOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium transition cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>Enter Key</span>
                </button>
              )}
              {provider === 'gemini' && ollamaModels.length > 0 && (
                <button
                  onClick={() => {
                    setProvider('ollama');
                    setErrorMessage(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium transition cursor-pointer"
                >
                  <Server className="w-3 h-3" />
                  <span>Switch to Ollama</span>
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:text-white text-zinc-400 rounded transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Global Navigation Header (Home & Studio). The project page owns its own chrome. */}
        {activeView !== 'project' && (
        <Header
          format={format}
          setFormat={handleFormatChange}
          provider={provider}
          setProvider={setProvider}
          isValid={isValid}
          onOpenApiKey={() => setIsApiKeyOpen(true)}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onExportHtml={handleExportHtml}
          isExporting={isExporting}
          onExportGlb={handleExportGlb}
          isExportingGlb={isExportingGlb}
          hasApiKey={Boolean(apiKey)}
          presetsCount={presets.length}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
          chatCount={messages.length}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          activeView={activeView}
          onNavigateHome={goHome}
          onNavigateStudio={goStudio}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        />
        )}

        {/* Home View vs Studio View */}
        {activeView === 'home' ? (
          <Homepage
            onStartScene={handleStartSceneFromHome}
            format={format}
            setFormat={handleFormatChange}
            size={size}
            setSize={setSize}
            provider={provider}
            setProvider={setProvider}
            ollamaModel={ollamaModel}
            setOllamaModel={setOllamaModel}
            ollamaModels={ollamaModels}
            geminiModel={geminiModel}
            setGeminiModel={setGeminiModel}
            hasApiKey={Boolean(apiKey)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
            onOpenGallery={() => setIsGalleryOpen(true)}
            isGenerating={isGenerating}
            onEnhancePrompt={handleEnhancePromptText}
            presets={presets}
            onSelectPreset={handleSelectPreset}
          />
        ) : activeView === 'studio' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Main Studio Workspace (Agent Studio Panel + Switched Stage) */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Left: Agent Studio & Unified Conversation/Generation Hub */}
              <ConversationPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={messages}
                currentVersion={messages.filter((m) => m.role === 'assistant' && m.version).length}
                onSendMessage={handleSendMessage}
                onRestoreVersion={handleRestoreVersion}
                onClearHistory={handleClearHistory}
                isProcessing={isProcessingChat || isGenerating}
                format={format}
                setFormat={handleFormatChange}
                provider={provider}
                geminiModel={geminiModel}
                setGeminiModel={setGeminiModel}
                ollamaModel={ollamaModel}
                setOllamaModel={setOllamaModel}
                ollamaModels={ollamaModels}
                onExportGlb={handleExportGlb}
                onEnhancePrompt={handleEnhancePrompt}
                isEnhancing={isEnhancing}
                onAskScene={handleAskScene}
                askSceneEnabled={askSceneEnabled}
                onToggleAskScene={setAskSceneEnabled}
                onCompareVersions={() => setDiffOpen(true)}
                seed={seed}
                seedLocked={seedLocked}
                onToggleSeedLock={() => setSeedLocked((v) => !v)}
              />

              <VersionDiff
                open={diffOpen}
                onClose={() => setDiffOpen(false)}
                versions={messages.filter((m) => m.role === 'assistant' && m.codeSnapshot)}
                currentCode={code}
                onApply={(next) => setCode(next)}
              />

              {/* Right: Main Stage with View Switcher (Preview / Code / Split) */}
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090b11]">
                {/* Main Stage Header Bar */}
                <div className="h-12 px-3 border-b border-white/[0.08] bg-[#0c0e17] flex items-center justify-between gap-2 z-10 shrink-0">
                  {/* Left: Scene Identity Badge */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-100 tracking-tight">
                      {validation?.name || currentPresetId || 'Any3d Scene'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08] uppercase">
                      {format}
                    </span>
                  </div>

                  {/* Center: Stage View Switcher (Preview | Code | Split) */}
                  <div className="flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-xs">
                    <button
                      type="button"
                      onClick={() => setStageView('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        stageView === 'preview'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">3D Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStageView('code')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        stageView === 'code'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Code ({lineCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStageView('split')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        stageView === 'split'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Split View</span>
                    </button>
                  </div>

                  {/* Right: secondary capture tools collapse before they force the bar to wrap */}
                  <div className="flex items-center gap-2">
                    <div className="hidden 2xl:flex items-center gap-2">
                    <ClipControl
                      previewRef={previewRef}
                      sceneName={validation?.name || currentPresetId || 'scene'}
                      disabled={!currentBundledHtml || stageView === 'code'}
                      compact
                    />
                    <StoryboardControl
                      previewRef={previewRef}
                      sceneName={validation?.name || currentPresetId || 'scene'}
                      format={format}
                      disabled={!currentBundledHtml || stageView === 'code'}
                    />
                    <PaletteFromPhoto
                      provider={provider}
                      geminiModel={geminiModel}
                      ollamaModel={ollamaModel}
                      ollamaModels={ollamaModels}
                      ollamaHost={ollamaHost}
                      apiKey={apiKey}
                      hasApiKey={Boolean(apiKey)}
                      onOpenSettings={() => setIsApiKeyOpen(true)}
                      onApply={(desc) => setPrompt((prev) => (prev.trim() ? `${prev.trim()}\n\n${desc}` : desc))}
                      disabled={isGenerating}
                    />
                    <button
                      type="button"
                      onClick={() => setDebugOpen(true)}
                      title="Open usage debug panel (Ctrl+Shift+D)"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-zinc-400 bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer"
                    >
                      <span className="text-[10px] font-mono">dbg</span>
                    </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition cursor-pointer ${
                        validation?.valid
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden 2xl:inline">{validation?.checks?.length ? `${validation.checks.length} checks` : 'Checks'}</span>
                    </button>
                  </div>
                </div>

                {/* Main Stage Content */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Code Editor (shown if stageView === 'code' or 'split') */}
                  {(stageView === 'code' || stageView === 'split') && (
                    <div
                      className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
                        stageView === 'split' ? 'w-[45%] border-r border-white/[0.08]' : 'w-full'
                      }`}
                    >
                      <div className="flex-1 overflow-hidden">
                        <CodeEditor
                          code={code}
                          setCode={setCode}
                          format={format}
                          onReset={handleResetCode}
                          linesCount={lineCount}
                        />
                      </div>
                      <ValidationInspector
                        report={validation}
                        isOpen={isInspectorOpen}
                        onToggle={() => setIsInspectorOpen(!isInspectorOpen)}
                      />
                    </div>
                  )}

                  {/* 3D Sandbox Preview (shown if stageView === 'preview' or 'split') */}
                  {(stageView === 'preview' || stageView === 'split') && (
                    <div className="flex-1 h-full overflow-hidden">
                      <SandboxPreview
                        ref={previewRef}
                        html={currentBundledHtml}
                        format={format}
                        sceneName={validation?.name || 'scene'}
                        isLoading={isBundling}
                        isGenerating={isGenerating || isProcessingChat}
                        generatingPrompt={prompt}
                        onRefresh={refreshSandbox}
                        look={stageLook}
                        onLookChange={setStageLook}
                      />
                    </div>
                  )}
                </div>
               </div>
             </div>
           </div>
         ) : (
           <>
           {route.view === 'shared' && !isShareApproved && (
             <div className="flex-1 flex items-center justify-center p-6 bg-[#090b11]">
               <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl p-5">
                 <div className="flex items-center gap-2 mb-2">
                   <AlertTriangle className="w-4 h-4 text-amber-400" />
                   <p className="text-sm font-semibold text-zinc-100">Open shared scene?</p>
                 </div>
                 <p className="text-[11px] leading-relaxed text-zinc-400">
                   This link carries a {(route.share || '').length.toLocaleString()}-character scene
                   payload that will run in the preview. Only open links from people you trust.
                 </p>
                 <div className="flex items-center justify-end gap-2 mt-4">
                   <button
                     type="button"
                     onClick={goHome}
                     className="px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                   >
                     Back to home
                   </button>
                   <button
                     type="button"
                     onClick={() => setApprovedShare(route.share || '')}
                     className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/20 transition cursor-pointer"
                   >
                     Open scene
                   </button>
                 </div>
               </div>
             </div>
           )}
           {(route.view !== 'shared' || isShareApproved) && (
           <ProjectPage
             projectId={route.projectId || (route.view === 'shared' ? 'shared' : NEW_PROJECT_ID)}
            title={
              sessions.find((s) => s.id === currentSessionId)?.title ||
              messages.find((m) => m.role === 'user')?.content.slice(0, 48) ||
              'Untitled project'
            }
            messages={messages}
            isProcessing={isProcessingChat || isGenerating}
            format={format}
            onSelectFormat={setFormat}
            providerLabel={provider === 'gemini' ? 'Gemini' : 'Ollama'}
            modelName={provider === 'gemini' ? geminiModel : ollamaModel || 'local'}
            hasApiKey={Boolean(apiKey)}
            provider={provider}
            geminiModel={geminiModel}
            ollamaModel={ollamaModel}
            ollamaHost={ollamaHost}
            apiKey={apiKey}
            onOpenSettings={() => setIsApiKeyOpen(true)}
            models={ollamaModels}
            presets={presets}
            onRemixPreset={handleRemixPreset}
            canSelectModel={provider === 'ollama'}
            onSelectModel={setOllamaModel}
            code={code}
            setCode={setCode}
            sceneName={validation?.name || ''}
            look={stageLook}
            onLookChange={setStageLook}
            html={currentBundledHtml}
            untrusted={route.view === 'shared'}
            isBundling={isBundling}
            validationOk={isValid}
            onSendMessage={handleSendMessage}
            onRestoreVersion={handleRestoreVersion}
            onEnhance={handleEnhancePrompt}
            seed={seed}
            seedLocked={seedLocked}
            onToggleSeedLock={() => setSeedLocked((v) => !v)}
            onExportHtml={handleExportHtml}
            onExportGlb={handleExportGlb}
            onBackHome={goHome}
            onOpenStudio={goStudio}
            onRefreshPreview={refreshSandbox}
            onResetCode={handleResetCode}
            previewRef={previewRef}
            colorMode={theme}
            onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          />
           )}
           </>
        )}
      </div>

      {/* Modals */}
      <PresetGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        presets={presets}
        currentId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        onRemixPreset={handleRemixPreset}
      />

      {debugOpen && <DebugPanel onClose={() => setDebugOpen(false)} />}

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        ollamaHost={ollamaHost}
        onSaveOllamaHost={handleSaveOllamaHost}
      />
    </div>
  );
}
