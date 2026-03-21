import { db, TEAM_ID, initAuth } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface CoachNote {
  id: string;
  coachName: string;
  note: string;
  timestamp: Date;
}

let authInitialized = false;

async function ensureAuth() {
  if (!authInitialized) {
    await initAuth();
    authInitialized = true;
  }
}

function notesCollection(playerNumber: number) {
  return collection(db, 'teams', TEAM_ID, 'players', String(playerNumber), 'notes');
}

/** Fetch all coach notes for a player, newest first */
export async function fetchCoachNotes(playerNumber: number): Promise<CoachNote[]> {
  await ensureAuth();

  const q = query(notesCollection(playerNumber), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      coachName: data.coachName ?? '',
      note: data.note ?? '',
      timestamp: data.timestamp?.toDate?.() ?? new Date(),
    };
  });
}

/** Add a new coach note for a player */
export async function addCoachNote(
  playerNumber: number,
  coachName: string,
  note: string,
): Promise<CoachNote> {
  await ensureAuth();

  const now = Timestamp.now();
  const docRef = await addDoc(notesCollection(playerNumber), {
    coachName,
    note,
    timestamp: now,
  });

  return {
    id: docRef.id,
    coachName,
    note,
    timestamp: now.toDate(),
  };
}
