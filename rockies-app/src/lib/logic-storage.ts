import { db, TEAM_ID, initAuth } from './firebase';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogicUpdate {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

let authInitialized = false;

async function ensureAuth() {
  if (!authInitialized) {
    await initAuth();
    authInitialized = true;
  }
}

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

function logicUpdatesCollection() {
  return collection(db, 'teams', TEAM_ID, 'logic-updates');
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/** Save a new logic update */
export async function saveLogicUpdate(
  author: string,
  text: string,
): Promise<LogicUpdate> {
  await ensureAuth();

  const id = `${author.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
  const ref = doc(logicUpdatesCollection(), id);
  const now = new Date();

  await setDoc(ref, {
    author,
    text,
    timestamp: Timestamp.fromDate(now),
  });

  return { id, author, text, timestamp: now };
}

/** Load all logic updates, newest first */
export async function loadLogicUpdates(): Promise<LogicUpdate[]> {
  await ensureAuth();

  const col = logicUpdatesCollection();

  // Try ordered query first; fall back to unordered if index doesn't exist
  let snap;
  try {
    const q = query(col, orderBy('timestamp', 'desc'));
    snap = await getDocs(q);
  } catch {
    snap = await getDocs(col);
  }

  if (snap.empty) return [];

  const updates = snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      author: d.author ?? 'Unknown',
      text: d.text ?? '',
      timestamp: d.timestamp?.toDate?.() ?? new Date(),
    } as LogicUpdate;
  });

  // Sort client-side to guarantee order
  updates.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return updates;
}
