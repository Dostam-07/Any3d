// The showcase line-up, shared by the capture script and the fidelity check so
// neither can drift from the other.
export const SCENES = [
  // Hero: four presets plus two prompts with no preset behind them.
  { key: 'harbour-hero', size: 'hero', kind: 'preset', format: 'svg', name: 'harbour', title: 'Deep-water harbour', motion: true },
  { key: 'florist-hero', size: 'hero', kind: 'preset', format: 'worlds', name: 'florist', title: 'Florist shop front' },
  { key: 'town-hero', size: 'hero', kind: 'preset', format: 'svg', name: 'town', title: 'Town square' },
  { key: 'airport-hero', size: 'hero', kind: 'preset', format: 'svg', name: 'airport', title: 'Terminal runway' },
  { key: 'market-hero', size: 'hero', kind: 'prompt', file: 'market', title: 'Night market (prompt only)', motion: true },
  { key: 'glacier-hero', size: 'hero', kind: 'prompt', file: 'glacier', title: 'Glacier lighthouse (prompt only)' },

  // Card: four presets plus two prompts with no preset behind them.
  { key: 'bakery-card', size: 'card', kind: 'preset', format: 'worlds', name: 'bakery', title: 'Corner bakery' },
  { key: 'classroom-card', size: 'card', kind: 'preset', format: 'svg', name: 'classroom', title: 'Classroom' },
  { key: 'flowerstall-card', size: 'card', kind: 'preset', format: 'pixel', name: 'flower-stall', title: 'Pixel flower stall' },
  { key: 'pier-card', size: 'card', kind: 'preset', format: 'pixel', name: 'pier', title: 'Pixel fishing pier' },
  { key: 'greenhouse-card', size: 'card', kind: 'prompt', file: 'greenhouse', title: 'Rooftop greenhouse (prompt only)' },
  { key: 'coral-card', size: 'card', kind: 'prompt', file: 'coral', title: 'Coral nursery (prompt only)' },
];

