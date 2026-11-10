import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Gamepad2,
  Sparkles,
  Trophy,
  RotateCcw,
  Eye,
  CheckCircle2,
  Layers,
  Palette,
  Clock,
  Compass,
} from 'lucide-react';

interface GenerationPlaygroundProps {
  isGenerating: boolean;
  prompt: string;
  format: string;
  onRevealScene?: () => void;
  hasReadyScene?: boolean;
}

interface Block {
  x: number;
  z: number;
  w: number;
  d: number;
  y: number;
  h: number;
  color: string;
}

interface Debris {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  vy: number;
  vx: number;
  vz: number;
  rot: number;
}

const STAGES = [
  {
    pct: 20,
    title: 'Spatial Architecture & Slab',
    desc: 'Laying isometric foundation plate, coordinate bounds and camera angle',
    icon: Compass,
  },
  {
    pct: 45,
    title: 'Modular Assembly & Parts',
    desc: 'Extruding structural geometry, columns, vehicles, and detail props',
    icon: Layers,
  },
  {
    pct: 75,
    title: 'Palette Shading & Lighting',
    desc: 'Balancing contrast across paper, ink, accent swatches and sun vectors',
    icon: Palette,
  },
  {
    pct: 95,
    title: 'Kinematic Loop & Validation',
    desc: 'Pacing tick delta, continuous wave paths, and deterministic linting',
    icon: Clock,
  },
];

const PALETTE = [
  '#e0604b', // Coral
  '#f59e0b', // Mustard
  '#10b981', // Sage/Emerald
  '#06b6d4', // Sky/Cyan
  '#6366f1', // Indigo
  '#ec4899', // Rose
  '#8b5cf6', // Plum
  '#14b8a6', // Teal
];

export const GenerationPlayground: React.FC<GenerationPlaygroundProps> = ({
  isGenerating,
  prompt,
  format,
  onRevealScene,
  hasReadyScene = false,
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'progress'>('game');
  const [progress, setProgress] = useState<number>(10);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('any3d_stack_highscore') || '0');
  });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [combo, setCombo] = useState<number>(0);
  const [perfectFlash, setPerfectFlash] = useState<boolean>(false);
  const [sceneReadyNotified, setSceneReadyNotified] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Game state refs
  const stateRef = useRef<{
    blocks: Block[];
    debris: Debris[];
    activeBlock: {
      x: number;
      z: number;
      w: number;
      d: number;
      y: number;
      h: number;
      axis: 'x' | 'z';
      dir: number;
      speed: number;
      color: string;
    };
    cameraY: number;
    targetCameraY: number;
  }>({
    blocks: [],
    debris: [],
    activeBlock: {
      x: 0,
      z: 0,
      w: 120,
      d: 120,
      y: 0,
      h: 22,
      axis: 'x',
      dir: 1,
      speed: 2.6,
      color: PALETTE[0],
    },
    cameraY: 0,
    targetCameraY: 0,
  });

  // Track progress and elapsed time
  useEffect(() => {
    if (!isGenerating) {
      if (hasReadyScene) {
        setProgress(100);
        setSceneReadyNotified(true);
        // Directly reveal scene immediately without waiting for a manual click or CTA
        onRevealScene?.();
      }
      return;
    }

    setSceneReadyNotified(false);
    startTimeRef.current = Date.now();
    setProgress(12);
    setElapsedSec(0);

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSec(elapsed);

      setProgress((prev) => {
        if (prev < 30) return prev + 3;
        if (prev < 65) return prev + 1.8;
        if (prev < 88) return prev + 0.8;
        if (prev < 96) return prev + 0.2;
        return prev;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [isGenerating, hasReadyScene]);

  // Restart / Init Game
  const initGame = useCallback(() => {
    const baseW = 120;
    const baseD = 120;
    const blockH = 22;

    stateRef.current.blocks = [
      {
        x: -baseW / 2,
        z: -baseD / 2,
        w: baseW,
        d: baseD,
        y: 0,
        h: blockH,
        color: '#2a324b',
      },
      {
        x: -baseW / 2,
        z: -baseD / 2,
        w: baseW,
        d: baseD,
        y: blockH,
        h: blockH,
        color: PALETTE[0],
      },
    ];

    stateRef.current.debris = [];
    stateRef.current.cameraY = 0;
    stateRef.current.targetCameraY = 0;

    stateRef.current.activeBlock = {
      x: -baseW / 2 - 130,
      z: -baseD / 2,
      w: baseW,
      d: baseD,
      y: blockH * 2,
      h: blockH,
      axis: 'x',
      dir: 1,
      speed: 3.2,
      color: PALETTE[1 % PALETTE.length],
    };

    setScore(0);
    setCombo(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Place current block
  const handleDropBlock = useCallback(() => {
    if (gameOver) {
      initGame();
      return;
    }

    const { blocks, activeBlock } = stateRef.current;
    const top = blocks[blocks.length - 1];
    let newW = activeBlock.w;
    let newD = activeBlock.d;
    let newX = activeBlock.x;
    let newZ = activeBlock.z;
    let isPerfect = false;

    if (activeBlock.axis === 'x') {
      const diff = activeBlock.x - top.x;
      if (Math.abs(diff) < 4) {
        // Perfect drop
        newX = top.x;
        isPerfect = true;
      } else if (diff > 0) {
        newW = top.w - diff;
        if (newW <= 0) {
          setGameOver(true);
          return;
        }
        // Slice debris on right
        stateRef.current.debris.push({
          x: newX + newW,
          y: activeBlock.y,
          z: activeBlock.z,
          w: diff,
          h: activeBlock.h,
          d: activeBlock.d,
          color: activeBlock.color,
          vy: 0,
          vx: 1.5,
          vz: 0,
          rot: 0.05,
        });
      } else {
        newW = top.w + diff;
        newX = top.x;
        if (newW <= 0) {
          setGameOver(true);
          return;
        }
        // Slice debris on left
        stateRef.current.debris.push({
          x: activeBlock.x,
          y: activeBlock.y,
          z: activeBlock.z,
          w: -diff,
          h: activeBlock.h,
          d: activeBlock.d,
          color: activeBlock.color,
          vy: 0,
          vx: -1.5,
          vz: 0,
          rot: -0.05,
        });
      }
    } else {
      // Axis z
      const diff = activeBlock.z - top.z;
      if (Math.abs(diff) < 4) {
        newZ = top.z;
        isPerfect = true;
      } else if (diff > 0) {
        newD = top.d - diff;
        if (newD <= 0) {
          setGameOver(true);
          return;
        }
        stateRef.current.debris.push({
          x: activeBlock.x,
          y: activeBlock.y,
          z: newZ + newD,
          w: activeBlock.w,
          h: activeBlock.h,
          d: diff,
          color: activeBlock.color,
          vy: 0,
          vx: 0,
          vz: 1.5,
          rot: 0.05,
        });
      } else {
        newD = top.d + diff;
        newZ = top.z;
        if (newD <= 0) {
          setGameOver(true);
          return;
        }
        stateRef.current.debris.push({
          x: activeBlock.x,
          y: activeBlock.y,
          z: activeBlock.z,
          w: activeBlock.w,
          h: activeBlock.h,
          d: -diff,
          color: activeBlock.color,
          vy: 0,
          vx: 0,
          vz: -1.5,
          rot: -0.05,
        });
      }
    }

    if (isPerfect) {
      setCombo((c) => c + 1);
      setPerfectFlash(true);
      setTimeout(() => setPerfectFlash(false), 250);
    } else {
      setCombo(0);
    }

    // Add block to stack
    const placed: Block = {
      x: newX,
      z: newZ,
      w: newW,
      d: newD,
      y: activeBlock.y,
      h: activeBlock.h,
      color: activeBlock.color,
    };
    blocks.push(placed);

    const nextScore = blocks.length - 2;
    setScore(nextScore);
    if (nextScore > highScore) {
      setHighScore(nextScore);
      localStorage.setItem('any3d_stack_highscore', String(nextScore));
    }

    // Scroll camera
    stateRef.current.targetCameraY = (blocks.length - 2) * activeBlock.h * 0.85;

    // Next active block
    const nextAxis: 'x' | 'z' = activeBlock.axis === 'x' ? 'z' : 'x';
    const nextColor = PALETTE[(blocks.length - 1) % PALETTE.length];
    const spawnDist = 140;

    stateRef.current.activeBlock = {
      x: nextAxis === 'x' ? newX - spawnDist : newX,
      z: nextAxis === 'z' ? newZ - spawnDist : newZ,
      w: newW,
      d: newD,
      y: activeBlock.y + activeBlock.h,
      h: activeBlock.h,
      axis: nextAxis,
      dir: 1,
      speed: Math.min(5.5, 3.2 + nextScore * 0.08),
      color: nextColor,
    };
  }, [gameOver, highScore, initGame]);

  // Global Spacebar Key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleDropBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDropBlock]);

  // Isometric Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const ISO_COS = Math.cos(Math.PI / 6);
    const ISO_SIN = Math.sin(Math.PI / 6);

    const toScreen = (x: number, y: number, z: number, originX: number, originY: number) => ({
      x: originX + (x - z) * ISO_COS,
      y: originY + (x + z) * ISO_SIN - y,
    });

    // Helper: shade hex color
    const shadeColor = (col: string, percent: number) => {
      let num = parseInt(col.replace('#', ''), 16);
      if (isNaN(num)) return col;
      let r = (num >> 16) + percent;
      let g = ((num >> 8) & 0x00ff) + percent;
      let b = (num & 0x0000ff) + percent;
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));
      return `rgb(${r},${g},${b})`;
    };

    const drawIsoBlock = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string,
      originX: number,
      originY: number
    ) => {
      const topColor = color;
      const leftColor = shadeColor(color, -35);
      const rightColor = shadeColor(color, -65);

      const p0 = toScreen(x, y + h, z, originX, originY);
      const p1 = toScreen(x + w, y + h, z, originX, originY);
      const p2 = toScreen(x + w, y + h, z + d, originX, originY);
      const p3 = toScreen(x, y + h, z + d, originX, originY);

      const b0 = toScreen(x, y, z + d, originX, originY);
      const b1 = toScreen(x + w, y, z + d, originX, originY);
      const b2 = toScreen(x + w, y, z, originX, originY);

      // Top Face
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fillStyle = topColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Left Face
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(b1.x, b1.y);
      ctx.lineTo(b0.x, b0.y);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();
      ctx.stroke();

      // Right Face
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.lineTo(b1.x, b1.y);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();
      ctx.stroke();
    };

    const loop = () => {
      if (!running) return;

      // Handle canvas resize
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayW = Math.floor(rect.width * dpr);
      const displayH = Math.floor(rect.height * dpr);

      if (canvas.width !== displayW || canvas.height !== displayH) {
        canvas.width = displayW;
        canvas.height = displayH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Dark background
      ctx.fillStyle = '#0f1118';
      ctx.fillRect(0, 0, width, height);

      // Subtle isometric grid lines on floor
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridOriginX = width / 2;
      const gridOriginY = height * 0.72;

      for (let i = -6; i <= 6; i++) {
        const start = toScreen(i * 30, 0, -180, gridOriginX, gridOriginY);
        const end = toScreen(i * 30, 0, 180, gridOriginX, gridOriginY);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const startZ = toScreen(-180, 0, i * 30, gridOriginX, gridOriginY);
        const endZ = toScreen(180, 0, i * 30, gridOriginX, gridOriginY);
        ctx.beginPath();
        ctx.moveTo(startZ.x, startZ.y);
        ctx.lineTo(endZ.x, endZ.y);
        ctx.stroke();
      }

      // Smooth camera interpolation
      const { targetCameraY, activeBlock, blocks, debris } = stateRef.current;
      stateRef.current.cameraY += (targetCameraY - stateRef.current.cameraY) * 0.08;

      const originX = width / 2;
      const originY = height * 0.72 + stateRef.current.cameraY;

      // Draw Stacked Blocks
      for (const b of blocks) {
        drawIsoBlock(b.x, b.y, b.z, b.w, b.h, b.d, b.color, originX, originY);
      }

      // Update & Draw Debris
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i];
        d.vy += 0.45; // gravity
        d.y -= d.vy;
        d.x += d.vx;
        d.z += d.vz;

        drawIsoBlock(d.x, d.y, d.z, d.w, d.h, d.d, d.color, originX, originY);

        if (d.y < -300) {
          debris.splice(i, 1);
        }
      }

      // Move Active Block if not game over
      if (!gameOver) {
        const top = blocks[blocks.length - 1];
        const span = 150;

        if (activeBlock.axis === 'x') {
          activeBlock.x += activeBlock.speed * activeBlock.dir;
          if (activeBlock.x > top.x + span) {
            activeBlock.dir = -1;
          } else if (activeBlock.x < top.x - span) {
            activeBlock.dir = 1;
          }
        } else {
          activeBlock.z += activeBlock.speed * activeBlock.dir;
          if (activeBlock.z > top.z + span) {
            activeBlock.dir = -1;
          } else if (activeBlock.z < top.z - span) {
            activeBlock.dir = 1;
          }
        }

        drawIsoBlock(
          activeBlock.x,
          activeBlock.y,
          activeBlock.z,
          activeBlock.w,
          activeBlock.h,
          activeBlock.d,
          activeBlock.color,
          originX,
          originY
        );
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameOver]);

  const activeStageIndex = Math.min(
    STAGES.length - 1,
    STAGES.findIndex((s) => progress <= s.pct) === -1
      ? STAGES.length - 1
      : STAGES.findIndex((s) => progress <= s.pct)
  );

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-xl text-white select-none overflow-hidden animate-fade-in">
      {/* Top Bar: Progressive Disclosure & Stage HUD */}
      <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Any3d {format.toUpperCase()} Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {Math.round(progress)}% Complete
              </span>
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                {elapsedSec}s elapsed
              </span>
            </div>
            <p className="text-xs text-zinc-300 truncate max-w-sm sm:max-w-md font-medium mt-0.5">
              "{prompt || 'Generating isometric 3D figure'}"
            </p>
          </div>
        </div>

        {/* Tab & View Switcher */}
        <div className="flex items-center gap-2">
          {hasReadyScene && onRevealScene && (
            <button
              onClick={onRevealScene}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>Reveal Scene</span>
            </button>
          )}

          <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition ${
                activeTab === 'game'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>AnyStack 3D</span>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition ${
                activeTab === 'progress'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Pipelines</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Track Gauge */}
      <div className="h-1 w-full bg-zinc-900 overflow-hidden relative shrink-0">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content Body */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {activeTab === 'game' ? (
          /* Canvas Mini Game: AnyStack 3D */
          <div
            onClick={handleDropBlock}
            className="w-full h-full relative cursor-pointer flex items-center justify-center"
          >
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* In-game HUD */}
            <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-mono tracking-tight text-white drop-shadow">
                  {score}
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Blocks
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                <Trophy className="w-3.5 h-3.5" />
                <span>Best: {highScore}</span>
              </div>
            </div>

            {/* Perfect Combo Alert */}
            {perfectFlash && (
              <div className="absolute top-20 pointer-events-none animate-bounce flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-bold backdrop-blur">
                <span>⭐ PERFECT DROP!</span>
                {combo > 1 && <span>x{combo}</span>}
              </div>
            )}

            {/* Bottom Tip / Controls Notice */}
            <div className="absolute bottom-5 pointer-events-none px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800/80 backdrop-blur text-xs text-zinc-300 flex items-center gap-2 shadow-xl">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                SPACE
              </kbd>
              <span>or Click / Tap anywhere to drop the block</span>
            </div>

            {/* Game Over Modal Overlay */}
            {gameOver && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center animate-fade-in">
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 max-w-xs w-full shadow-2xl flex flex-col items-center">
                  <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                    Tower Settled
                  </span>
                  <div className="text-4xl font-black text-white font-mono mb-2">{score}</div>
                  <p className="text-xs text-zinc-400 mb-5">
                    {score >= highScore && score > 0
                      ? '🏆 New Personal Record!'
                      : `High score: ${highScore}`}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      initGame();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Stack Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Progressive Disclosure Pipeline View */
          <div className="w-full max-w-xl p-6 flex flex-col gap-4 animate-fade-in">
            <div className="text-center mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                Progressive Synthesis Pipeline
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Constructing clean geometric blocks, light passes, and deterministic motion.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {STAGES.map((s, idx) => {
                const isPassed = progress > s.pct;
                const isCurrent = idx === activeStageIndex;
                const Icon = s.icon;

                return (
                  <div
                    key={s.title}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/10 scale-[1.01]'
                        : isPassed
                        ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isCurrent
                              ? 'bg-indigo-500 text-white'
                              : isPassed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold">{s.title}</span>
                      </div>

                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <span className="text-[10px] font-mono text-indigo-300 animate-pulse">
                          Active...
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-600">Queued</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-9">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scene Ready Notification Banner */}
        {hasReadyScene && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md shadow-2xl animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div className="text-xs text-emerald-200">
              <span className="font-bold">Scene Ready!</span>
            </div>
            {onRevealScene && (
              <button
                onClick={onRevealScene}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition"
              >
                View
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Stage Ticker */}
      <div className="px-5 py-2.5 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="font-medium text-zinc-300">
            {STAGES[activeStageIndex]?.title || 'Finalizing Any3d scene...'}
          </span>
          <span className="hidden sm:inline text-zinc-500">—</span>
          <span className="hidden sm:inline text-zinc-500 truncate">
            {STAGES[activeStageIndex]?.desc}
          </span>
        </div>
        <span className="font-mono text-[11px] text-indigo-400 shrink-0 ml-2">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

