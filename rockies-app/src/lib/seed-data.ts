import { players as defaultPlayers } from '@/data/players';
import { INITIAL_GAMES } from '@/data/schedule';
import {
  savePlayers,
  loadPlayers,
  saveDepthCharts,
  loadDepthCharts,
  saveSchedule,
  loadSchedule,
  type DepthCharts,
} from './player-storage';

// ---------------------------------------------------------------------------
// Default depth charts (extracted from lineup-engine.ts hardcoded values)
// ---------------------------------------------------------------------------

const DEFAULT_DEPTH_CHARTS: DepthCharts = {
  pitchers: [
    { num: 7, tier: 'ace' },
    { num: 10, tier: 'ace' },
    { num: 8, tier: 'solid' },
    { num: 9, tier: 'solid' },
    { num: 11, tier: 'other' },
    { num: 3, tier: 'other' },
    { num: 5, tier: 'possible' },
  ],
  catchers: [
    { num: 9, note: 'Best catcher — limit usage to preserve for all-star' },
    { num: 10, note: 'Stud but need him in IF' },
    { num: 8, note: 'Solid reliable option' },
    { num: 4, note: 'Serviceable & strategic — frees skilled players for IF' },
  ],
  shortstops: [
    { num: 7, note: 'Best SS on team' },
    { num: 10, note: 'Best SS on team' },
    { num: 8, note: 'Solid backup SS' },
  ],
  firstBase: [
    { num: 9, note: 'Best 1B — sure-handed' },
    { num: 10, note: 'Best 1B — great infielder' },
    { num: 8, note: 'Solid option' },
    { num: 11, note: 'Serviceable — good hands' },
  ],
};

// ---------------------------------------------------------------------------
// Seed function — runs once on first load if Firebase is empty
// ---------------------------------------------------------------------------

/**
 * Seeds Firebase with initial data if the collections are empty.
 * This runs once on first load, then Firebase is the source of truth.
 */
export async function seedFirebase(): Promise<void> {
  // Seed players if empty
  const existingPlayers = await loadPlayers();
  if (!existingPlayers) {
    console.log('[seed] No players in Firebase — seeding default roster...');
    await savePlayers(defaultPlayers);
  }

  // Seed depth charts if empty
  const existingCharts = await loadDepthCharts();
  if (!existingCharts) {
    console.log('[seed] No depth charts in Firebase — seeding defaults...');
    await saveDepthCharts(DEFAULT_DEPTH_CHARTS);
  }

  // Seed schedule if empty
  const existingSchedule = await loadSchedule();
  if (!existingSchedule) {
    console.log('[seed] No schedule in Firebase — seeding default games...');
    await saveSchedule(INITIAL_GAMES);
  }
}
