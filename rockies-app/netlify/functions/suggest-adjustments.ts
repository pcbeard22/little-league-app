interface PlayerSummary {
  number: number;
  name: string;
  positions: string;
  tier: string;
  notes: string;
}

interface RequestBody {
  gameNotes: string[];
  playerSummaries: PlayerSummary[];
}

interface AIAdjustment {
  playerNumber: number;
  position: string;
  adjustment: number;
  reason: string;
}

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
}

interface NetlifyResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { gameNotes, playerSummaries } = body;

  if (!gameNotes || !Array.isArray(gameNotes) || gameNotes.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ adjustments: [] }) };
  }

  // Build the prompt
  const playerList = playerSummaries
    .map((p) => `#${p.number} ${p.name} — ${p.positions} (${p.tier}) | Notes: ${p.notes}`)
    .join('\n');

  const notesText = gameNotes
    .map((note, i) => `Game ${i + 1} notes:\n${note}`)
    .join('\n\n');

  const systemPrompt = `You are a little league baseball assistant. Analyze these recent game notes from the coach and return position fitness score adjustments for the upcoming game.

Players on the team:
${playerList}

Recent game notes:
${notesText}

Return a JSON array of adjustments. Each adjustment has:
- playerNumber: jersey number
- position: the position affected (P, C, 1B, 2B, 3B, SS, LF, CF, RF)
- adjustment: a number from -20 to +20 (negative = worse fit, positive = better fit based on recent performance)
- reason: brief explanation

Only return adjustments where the game notes contain clear evidence. Don't make adjustments for things not mentioned in notes. Return an empty array if notes don't contain actionable information.

Respond with ONLY valid JSON, no markdown or explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return { statusCode: 200, body: JSON.stringify({ adjustments: [] }) };
    }

    const data = await response.json();

    // Extract text content from Claude's response
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === 'text',
    );
    const rawText: string = textBlock?.text ?? '[]';

    // Parse the JSON — Claude should return a raw array
    let adjustments: AIAdjustment[];
    try {
      const parsed = JSON.parse(rawText);
      // Handle both { adjustments: [...] } and plain [...]
      adjustments = Array.isArray(parsed) ? parsed : (parsed.adjustments ?? []);
    } catch {
      console.error('Failed to parse Claude response:', rawText);
      adjustments = [];
    }

    // Validate and clamp adjustments
    const validated: AIAdjustment[] = adjustments
      .filter(
        (a) =>
          typeof a.playerNumber === 'number' &&
          typeof a.position === 'string' &&
          typeof a.adjustment === 'number',
      )
      .map((a) => ({
        playerNumber: a.playerNumber,
        position: a.position,
        adjustment: Math.max(-20, Math.min(20, a.adjustment)),
        reason: String(a.reason ?? ''),
      }));

    return {
      statusCode: 200,
      body: JSON.stringify({ adjustments: validated }),
    };
  } catch (err) {
    console.error('Unexpected error calling Claude:', err);
    return { statusCode: 200, body: JSON.stringify({ adjustments: [] }) };
  }
}
