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
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface SavedLineup {
  id: string;             // gameId like 'g5'
  gameName: string;       // "Game 5 vs Reds"
  gameDate: string;       // "Mar 21, 2026"
  battingOrder: number[];
  positionsByInning: string[][];
  absentPlayers: number[];
  gameNotes: string;
  savedAt: Date;
  updatedAt: Date;
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
    positionsByInning: lineup.positionsByInning,
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
    positionsByInning: d.positionsByInning,
    absentPlayers: d.absentPlayers ?? [],
    gameNotes: d.gameNotes ?? '',
    savedAt: d.savedAt?.toDate?.() ?? new Date(),
    updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
  };
}

/** Load all saved lineups for this team */
export async function loadAllLineups(): Promise<SavedLineup[]> {
  await ensureAuth();

  const q = query(
    collection(db, 'lineups'),
    where('teamId', '==', TEAM_ID),
    orderBy('updatedAt', 'desc'),
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: d.id,
      gameName: d.gameName,
      gameDate: d.gameDate,
      battingOrder: d.battingOrder,
      positionsByInning: d.positionsByInning,
      absentPlayers: d.absentPlayers ?? [],
      gameNotes: d.gameNotes ?? '',
      savedAt: d.savedAt?.toDate?.() ?? new Date(),
      updatedAt: d.updatedAt?.toDate?.() ?? new Date(),
    };
  });
}

/** Delete a lineup */
export async function deleteLineup(gameId: string): Promise<void> {
  await ensureAuth();
  await deleteDoc(doc(db, 'lineups', docId(gameId)));
}
