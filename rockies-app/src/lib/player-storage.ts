import { db, TEAM_ID, initAuth } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import type { Player } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DepthCharts {
  pitchers: { num: number; tier: string }[];
  catchers: { num: number; note: string }[];
  shortstops: { num: number; note: string }[];
  firstBase: { num: number; note: string }[];
}

export interface GameData {
  id: string;
  date: string;
  time: string;
  opponent: string;
  opponentFull: string;
  location: 'home' | 'away';
  status: 'completed' | 'upcoming';
  score?: { us: number; them: number };
  result?: 'W' | 'L' | 'T';
}

export interface CoachNote {
  coachName: string;
  note: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Auth helper (same pattern as lineup-storage.ts)
// ---------------------------------------------------------------------------

let authInitialized = false;

async function ensureAuth() {
  if (!authInitialized) {
    await initAuth();
    authInitialized = true;
  }
}

// ---------------------------------------------------------------------------
// Firestore path helpers
// ---------------------------------------------------------------------------

function playersCollection() {
  return collection(db, 'teams', TEAM_ID, 'players');
}

function playerDoc(playerNumber: number) {
  return doc(db, 'teams', TEAM_ID, 'players', String(playerNumber));
}

function configDoc(configId: string) {
  return doc(db, 'teams', TEAM_ID, 'config', configId);
}

function coachNotesCollection(playerNumber: number) {
  return collection(db, 'teams', TEAM_ID, 'players', String(playerNumber), 'coach-notes');
}

// ---------------------------------------------------------------------------
// Player CRUD
// ---------------------------------------------------------------------------

/** Save all players to Firebase (bulk write using batch) */
export async function savePlayers(players: Player[]): Promise<void> {
  await ensureAuth();

  const batch = writeBatch(db);

  for (const player of players) {
    const ref = playerDoc(player.number);
    batch.set(ref, {
      ...player,
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

/** Load all players from Firebase */
export async function loadPlayers(): Promise<Player[] | null> {
  await ensureAuth();

  const snap = await getDocs(playersCollection());

  if (snap.empty) return null;

  const players: Player[] = snap.docs.map((docSnap) => {
    const d = docSnap.data();
    // Strip Firestore metadata fields, return clean Player object
    const { updatedAt, ...playerData } = d;
    return playerData as Player;
  });

  // Sort by number for consistent ordering
  players.sort((a, b) => a.number - b.number);

  return players;
}

/** Save a single player update */
export async function savePlayer(player: Player): Promise<void> {
  await ensureAuth();

  const ref = playerDoc(player.number);
  await setDoc(ref, {
    ...player,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

// ---------------------------------------------------------------------------
// Depth Charts
// ---------------------------------------------------------------------------

/** Save depth charts */
export async function saveDepthCharts(charts: DepthCharts): Promise<void> {
  await ensureAuth();

  const ref = configDoc('depth-charts');
  await setDoc(ref, {
    ...charts,
    updatedAt: Timestamp.now(),
  });
}

/** Load depth charts */
export async function loadDepthCharts(): Promise<DepthCharts | null> {
  await ensureAuth();

  const ref = configDoc('depth-charts');
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    pitchers: d.pitchers,
    catchers: d.catchers,
    shortstops: d.shortstops,
    firstBase: d.firstBase,
  };
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

/** Save schedule/games */
export async function saveSchedule(games: GameData[]): Promise<void> {
  await ensureAuth();

  const ref = configDoc('schedule');
  await setDoc(ref, {
    games,
    updatedAt: Timestamp.now(),
  });
}

/** Load schedule */
export async function loadSchedule(): Promise<GameData[] | null> {
  await ensureAuth();

  const ref = configDoc('schedule');
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const d = snap.data();
  return (d.games ?? null) as GameData[] | null;
}

// ---------------------------------------------------------------------------
// Coach Notes
// ---------------------------------------------------------------------------

/** Save a coach note for a player (supports multiple coaches) */
export async function saveCoachNote(
  playerNumber: number,
  coachName: string,
  note: string,
): Promise<void> {
  await ensureAuth();

  const notesCol = coachNotesCollection(playerNumber);
  const noteId = `${coachName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
  const ref = doc(notesCol, noteId);

  await setDoc(ref, {
    coachName,
    note,
    timestamp: Timestamp.now(),
  });
}

/** Load coach notes for a player */
export async function loadCoachNotes(playerNumber: number): Promise<CoachNote[]> {
  await ensureAuth();

  const notesCol = coachNotesCollection(playerNumber);
  const snap = await getDocs(notesCol);

  if (snap.empty) return [];

  return snap.docs
    .map((docSnap) => {
      const d = docSnap.data();
      return {
        coachName: d.coachName,
        note: d.note,
        timestamp: d.timestamp?.toDate?.() ?? new Date(),
      } as CoachNote;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
