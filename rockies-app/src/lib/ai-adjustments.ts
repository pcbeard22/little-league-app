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
): Promise<AIAdjustment[]> {
  // Don't call if there are no notes worth analyzing
  const meaningfulNotes = gameNotes.filter((n) => n.trim().length > 0);
  if (meaningfulNotes.length === 0) return [];

  try {
    const playerSummaries = players.map((p) => ({
      number: p.number,
      name: `${p.firstName} ${p.lastName}`,
      positions: [p.positions.primary, ...p.positions.secondary].join(', '),
      tier: p.tier,
      notes: p.notes,
    }));

    const response = await fetch('/.netlify/functions/suggest-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameNotes: meaningfulNotes,
        playerSummaries,
      }),
    });

    if (!response.ok) return [];

    const data: AdjustmentsResponse = await response.json();
    return data.adjustments ?? [];
  } catch {
    // Network error, parse error, etc. — silently return empty
    return [];
  }
}
