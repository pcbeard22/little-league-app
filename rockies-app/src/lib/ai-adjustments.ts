import type { Player } from '@/types';

export interface AIAdjustment {
  playerNumber: number;
  position: string;
  adjustment: number;
  reason: string;
}

interface AdjustmentsResponse {
  adjustments: AIAdjustment[];
}

/**
 * Calls the Netlify serverless function to get AI-powered position fitness
 * adjustments based on recent game notes.
 *
 * Returns an empty array on any error — AI is a nice-to-have, not a blocker.
 */
export async function fetchAIAdjustments(
  gameNotes: string[],
  players: Player[],
  rosterNotes?: string[],
  lineupPatterns?: string,
  logicUpdates?: string[],
): Promise<AIAdjustment[]> {
  // Don't call if there are no notes worth analyzing
  const meaningfulNotes = gameNotes.filter((n) => n.trim().length > 0);
  const meaningfulRosterNotes = (rosterNotes ?? []).filter((n) => n.trim().length > 0);
  if (meaningfulNotes.length === 0 && meaningfulRosterNotes.length === 0) return [];

  try {
    const playerSummaries = players.map((p) => ({
      number: p.number,
      name: `${p.firstName} ${p.lastName}`,
      positions: [p.positions.primary, ...p.positions.secondary].join(', '),
      tier: p.tier,
      notes: p.notes,
    }));

    const payload: Record<string, unknown> = {
      gameNotes: meaningfulNotes,
      playerSummaries,
    };
    if (meaningfulRosterNotes.length > 0) {
      payload.rosterNotes = meaningfulRosterNotes;
    }
    if (lineupPatterns?.trim()) {
      payload.lineupPatterns = lineupPatterns;
    }
    const meaningfulLogicUpdates = (logicUpdates ?? []).filter((u) => u.trim().length > 0);
    if (meaningfulLogicUpdates.length > 0) {
      payload.logicUpdates = meaningfulLogicUpdates;
    }

    const response = await fetch('/.netlify/functions/suggest-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return [];

    const data: AdjustmentsResponse = await response.json();
    return data.adjustments ?? [];
  } catch {
    // Network error, parse error, etc. — silently return empty
    return [];
  }
}
