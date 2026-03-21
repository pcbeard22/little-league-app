import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Player } from '@/types';
import { players as defaultPlayers } from '@/data/players';
import {
  loadPlayers,
  savePlayer,
  saveCoachNote,
  loadCoachNotes,
  type CoachNote,
} from '@/lib/player-storage';
import { seedFirebase } from '@/lib/seed-data';

interface PlayersContextValue {
  players: Player[];
  loading: boolean;
  updatePlayerName: (number: number, firstName: string, lastName: string) => void;
  updatePlayer: (number: number, updates: Partial<Omit<Player, 'number'>>) => void;
  addCoachNote: (playerNumber: number, coachName: string, note: string) => Promise<void>;
  coachNotes: Record<number, CoachNote[]>;
  loadPlayerCoachNotes: (playerNumber: number) => Promise<void>;
}

const PlayersContext = createContext<PlayersContextValue | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([...defaultPlayers]);
  const [loading, setLoading] = useState(true);
  const [coachNotes, setCoachNotes] = useState<Record<number, CoachNote[]>>({});

  // Load players from Firebase on mount; seed if empty
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Seed Firebase if collections are empty (no-op if already seeded)
        await seedFirebase();

        // Load players from Firebase
        const firebasePlayers = await loadPlayers();

        if (!cancelled) {
          if (firebasePlayers && firebasePlayers.length > 0) {
            setPlayers(firebasePlayers);
          }
          // If loadPlayers returned null, seedFirebase already saved the defaults,
          // so the local state (defaultPlayers) is correct.
        }
      } catch (error) {
        console.error('[PlayersProvider] Failed to load from Firebase:', error);
        // Fall back to hardcoded defaults (already set as initial state)
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const updatePlayerName = useCallback((number: number, firstName: string, lastName: string) => {
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.number === number ? { ...p, firstName, lastName } : p,
      );

      // Persist the updated player to Firebase
      const updated = next.find((p) => p.number === number);
      if (updated) {
        savePlayer(updated).catch((err) =>
          console.error('[PlayersProvider] Failed to save player name:', err),
        );
      }

      return next;
    });
  }, []);

  const updatePlayer = useCallback((number: number, updates: Partial<Omit<Player, 'number'>>) => {
    setPlayers((prev) => {
      const next = prev.map((p) =>
        p.number === number ? { ...p, ...updates } : p,
      );

      // Persist the updated player to Firebase
      const updated = next.find((p) => p.number === number);
      if (updated) {
        savePlayer(updated).catch((err) =>
          console.error('[PlayersProvider] Failed to save player update:', err),
        );
      }

      return next;
    });
  }, []);

  const addCoachNote = useCallback(async (playerNumber: number, coachName: string, note: string) => {
    // Save to Firebase
    await saveCoachNote(playerNumber, coachName, note);

    // Reload notes for this player
    const notes = await loadCoachNotes(playerNumber);
    setCoachNotes((prev) => ({
      ...prev,
      [playerNumber]: notes,
    }));
  }, []);

  const loadPlayerCoachNotes = useCallback(async (playerNumber: number) => {
    const notes = await loadCoachNotes(playerNumber);
    setCoachNotes((prev) => ({
      ...prev,
      [playerNumber]: notes,
    }));
  }, []);

  return (
    <PlayersContext.Provider
      value={{
        players,
        loading,
        updatePlayerName,
        updatePlayer,
        addCoachNote,
        coachNotes,
        loadPlayerCoachNotes,
      }}
    >
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used within PlayersProvider');
  return ctx;
}
