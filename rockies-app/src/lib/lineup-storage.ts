import { db, TEAM_ID, initAuth } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

export interface GameNote {
  author: string;
  date: string;    // ISO date string like "2026-03-25"
  text: string;
}

export type GameNoteEntry = GameNote;

export interface SavedLineup {
  id: string;             // gameId like 'g5'
  gameName: string;       // "Game 5 vs Reds"
  gameDate: string;       // "Mar 21, 2026"
  battingOrder: number[];
  positionsByInning: string[][];
  absentPlayers: number[];
  gameNotes: string;      // JSON-serialized GameNote[]
  savedAt: Date;
  updatedAt: Date;
}

export function serializeNotes(notes: GameNote[]): string {
  return JSON.stringify(notes);
}

export function deserializeNotes(raw: string): GameNote[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Legacy: plain string notes — migrate to attributed format
    if (raw.trim()) {
      return [{ author: 'Coach Peyton', date: '2026-03-25', text: raw }];
    }
  }
  return [];
}

let authInitialized = false;

async function ensureAuth() {
  if (!authInitialized) {
    await initAuth();
    authInitialized = true;
  }
}

function docId(gameId: string): string {
  return `${TEAM_ID}_${gameId}`;
}

// ---------------------------------------------------------------------------
// Firestore can't store nested arrays (string[][]).
// Flatten to a JSON string on save, parse back on load.
// ---------------------------------------------------------------------------
function flattenPositions(positions: string[][]): string {
  return JSON.stringify(positions);
}

function unflattenPositions(raw: unknown): string[][] {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  // Backwards compat: if somehow stored as array, return as-is
  if (Array.isArray(raw)) return raw as string[][];
  return [];
}

/** Save a lineup (create or update) */
export async function saveLineup(
  lineup: Omit<SavedLineup, 'savedAt' | 'updatedAt'>,
): Promise<void> {
  await ensureAuth();

  const ref = doc(db, 'lineups', docId(lineup.id));
  const existing = await getDoc(ref);

  const now = Timestamp.now();
  const data: Record<string, unknown> = {
    teamId: TEAM_ID,
    id: lineup.id,
    gameName: lineup.gameName,
    gameDate: lineup.gameDate,
    battingOrder: lineup.battingOrder,
    positionsByInning: flattenPositions(lineup.positionsByInning),
    absentPlayers: lineup.absentPlayers,
    gameNotes: lineup.gameNotes,
    updatedAt: now,
  };

  if (!existing.exists()) {
    data.savedAt = now;
  }

  await setDoc(ref, data, { merge: true });
}

/** Load a lineup by game ID */
export async function loadLineup(gameId: string): Promise<SavedLineup | null> {
  await ensureAuth();

  const ref = doc(db, 'lineups', docId(gameId));
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    id: d.id,
    gameName: d.gameName,
    gameDate: d.gameDate,
    battingOrder: d.battingOrder,
    positionsByInning: unflattenPositions(d.positionsByInning),
    absentPlayers: d.absentPlayers ?? [],
    gameNotes: d.gameNotes ?? '',
    savedAt: d.savedAt?.toDate?.() ?? new Date(),
    updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
  };
}

/** Load all saved lineups for this team */
export async function loadAllLineups(): Promise<SavedLineup[]> {
  await ensureAuth();

  // Simple query without orderBy to avoid needing a composite index
  const q = query(
    collection(db, 'lineups'),
    where('teamId', '==', TEAM_ID),
  );

  const snap = await getDocs(q);
  const lineups = snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: d.id,
      gameName: d.gameName,
      gameDate: d.gameDate,
      battingOrder: d.battingOrder,
      positionsByInning: unflattenPositions(d.positionsByInning),
      absentPlayers: d.absentPlayers ?? [],
      gameNotes: d.gameNotes ?? '',
      savedAt: d.savedAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  });

  // Sort client-side by updatedAt desc
  lineups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return lineups;
}

/** Rename a saved lineup */
export async function renameLineup(gameId: string, newName: string): Promise<void> {
  await ensureAuth();
  const ref = doc(db, 'lineups', docId(gameId));
  await setDoc(ref, { gameName: newName, updatedAt: Timestamp.now() }, { merge: true });
}

/** Delete a lineup */
export async function deleteLineup(gameId: string): Promise<void> {
  await ensureAuth();
  await deleteDoc(doc(db, 'lineups', docId(gameId)));
}
