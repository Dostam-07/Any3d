import { RenderFormat } from '../types';

/**
 * Curated place × activity × light × palette combinations.
 *
 * Each card is a complete prompt, not a random word salad: the four axes are
 * chosen to work together (a night market is lit, a snowbound pier is cold), so
 * one click always produces a scene worth looking at.
 */
export interface SurpriseCard {
  id: string;
  place: string;
  activity: string;
  light: string;
  palette: string;
  format: RenderFormat;
  prompt: string;
}

export const SURPRISE_DECK: SurpriseCard[] = [
  {
    id: 'harbour-dawn',
    place: 'Container harbour quay',
    activity: 'a gantry crane lifting a crate',
    light: 'dawn',
    palette: 'cool steel and rust',
    format: 'svg',
    prompt:
      'A container harbour quay at dawn with a gantry crane lifting a crate, cool steel and rust palette, long soft shadows',
  },
  {
    id: 'cafe-golden',
    place: 'Street-corner coffee cart',
    activity: 'a barista pulling shots',
    light: 'golden hour',
    palette: 'warm terracotta and cream',
    format: 'svg',
    prompt:
      'A retro coffee cart on a street corner at golden hour with a barista pulling shots and a cat on a chair, warm terracotta and cream palette',
  },
  {
    id: 'lighthouse-storm',
    place: 'Cliffside lighthouse',
    activity: 'a revolving beam sweeping the water',
    light: 'night',
    palette: 'deep indigo and bone white',
    format: 'dither',
    prompt:
      'A solitary cliffside lighthouse at night in storm winds with a revolving beam, deep indigo and bone white palette',
  },
  {
    id: 'bakery-morning',
    place: 'Village bakery',
    activity: 'a baker rolling dough on a flour-dusted bench',
    light: 'early morning',
    palette: 'flour white and honey',
    format: 'worlds',
    prompt:
      'A morning bakery with a baker rolling dough on a flour-dusted bench, flour white and honey palette, soft window light',
  },
  {
    id: 'flower-dusk',
    place: 'Flower stall on wet cobblestone',
    activity: 'a florist arranging tulip buckets',
    light: 'blue hour',
    palette: 'muted rose and slate',
    format: 'pixel',
    prompt:
      'A flower stall on wet cobblestone at blue hour with buckets of tulips and an awning, muted rose and slate palette',
  },
  {
    id: 'forge-ember',
    place: 'Mountain forge',
    activity: 'a water wheel turning beside glowing embers',
    light: 'dusk',
    palette: 'charcoal and ember orange',
    format: 'dither',
    prompt:
      'A weathered mountain forge at dusk with a water wheel turning and glowing embers, charcoal and ember orange palette',
  },
  {
    id: 'allotment-noon',
    place: 'Riverside allotment',
    activity: 'raised vegetable patches and a shed',
    light: 'noon',
    palette: 'leaf green and chalk',
    format: 'pixel',
    prompt:
      'A peaceful riverside allotment at noon with raised vegetable patches and a shed, leaf green and chalk palette, crisp shadows',
  },
  {
    id: 'observatory-night',
    place: 'Hilltop observatory',
    activity: 'a telescope dome opening to the stars',
    light: 'night',
    palette: 'midnight blue and brass',
    format: 'worlds',
    prompt:
      'A hilltop observatory at night with a telescope dome opening to the stars, midnight blue and brass palette',
  },
  {
    id: 'tea-house-rain',
    place: 'Hillside tea house',
    activity: 'steam rising from a kettle',
    light: 'overcast afternoon',
    palette: 'moss green and paper',
    format: 'dither',
    prompt:
      'A traditional hillside tea house on an overcast afternoon with bamboo railings, a gravel garden and steam rising from a kettle, moss green and paper palette',
  },
  {
    id: 'launchpad-dawn',
    place: 'Rocket launchpad',
    activity: 'a gantry arm swinging clear',
    light: 'pre-dawn',
    palette: 'gunmetal and sodium orange',
    format: 'svg',
    prompt:
      'A rocket launchpad before dawn with floodlights and a swinging gantry arm, gunmetal and sodium orange palette',
  },
];

/** Draw a card, avoiding an immediate repeat when the deck has alternatives. */
export function drawSurprise(excludeId?: string): SurpriseCard {
  const pool = SURPRISE_DECK.filter((card) => card.id !== excludeId);
  const cards = pool.length ? pool : SURPRISE_DECK;
  return cards[Math.floor(Math.random() * cards.length)];
}
