import type { Player } from '@/types';
import type { AIAdjustment } from '@/lib/ai-adjustments';

// ---------------------------------------------------------------------------
// Coach-defined depth charts (by jersey number)
// These provide large score bonuses layered ON TOP of attribute scoring.
// ---------------------------------------------------------------------------

// Pitcher depth: bonus points by tier
const PITCHER_DEPTH: Record<number, number> = {
  7: 100,   // Rodney — ace
  10: 95,   // Carson — ace
  9: 75,    // Kellen — strong
  8: 60,    // Bennett — solid
  11: 40,   // Riley — as needed
  3: 35,    // Leo — as needed
  5: 15,    // Hudson — possible
};

// Catcher depth: bonus points
const CATCHER_DEPTH: Record<number, number> = {
  9: 100,   // Kellen — best (but limit usage)
  10: 90,   // Carson — stud (but need him IF)
  8: 75,    // Bennett — solid
  4: 60,    // Stephoni — serviceable & strategic
};

// SS depth: bonus points
const SS_DEPTH: Record<number, number> = {
  7: 100,   // Rodney — best
  10: 95,   // Carson — best
  8: 60,    // Bennett — solid
};

// 1B depth: bonus points
const FIRSTBASE_DEPTH: Record<number, number> = {
  9: 100,   // Kellen — best
  10: 95,   // Carson — best
  8: 65,    // Bennett — solid
  11: 40,   // Riley — serviceable
};

// ---------------------------------------------------------------------------
// Position fitness scoring (attributes + depth chart bonus)
// ---------------------------------------------------------------------------

function positionFitScore(player: Player, position: string, aiAdjustments?: AIAdjustment[]): number {
  const { attributes, positions, tier } = player;
  let score = 0;

  // Primary/secondary position bonuses from player data
  if (positions.primary === position) score += 30;
  if (positions.secondary.includes(position)) score += 15;
  if (positions.avoid?.includes(position)) score -= 200;
  if (positions.avoid?.includes('IF') && ['1B', '2B', '3B', 'SS'].includes(position)) {
    score -= 200;
  }

  // Attribute-based scoring per position
  switch (position) {
    case 'P':
      score += attributes.armStrength * 6 + attributes.focus * 4 + attributes.baseballIQ * 3 + attributes.attitude * 2;
      break;
    case 'C':
      score += attributes.fielding * 5 + attributes.focus * 5 + attributes.baseballIQ * 4 + attributes.armStrength * 3;
      break;
    case 'SS':
      score += attributes.fielding * 5 + attributes.armStrength * 4 + attributes.speed * 3 + attributes.baseballIQ * 3;
      break;
    case '3B':
      score += attributes.fielding * 4 + attributes.armStrength * 5 + attributes.baseballIQ * 3;
      break;
    case '2B':
      score += attributes.fielding * 5 + attributes.speed * 3 + attributes.baseballIQ * 3 + attributes.handEyeCoordination * 2;
      break;
    case '1B':
      score += attributes.fielding * 5 + attributes.handEyeCoordination * 3 + attributes.power * 2;
      break;
    case 'LF':
    case 'RF':
      score += attributes.fielding * 3 + attributes.speed * 2 + attributes.focus * 2;
      break;
    case 'CF':
      score += attributes.speed * 5 + attributes.fielding * 4 + attributes.focus * 3;
      break;
  }

  // Tier bonus
  if (tier === 'star') score += 10;
  if (tier === 'developmental') score -= 5;

  // Layer on depth chart bonuses (these are the coach overrides)
  const num = player.number;
  if (position === 'P' && PITCHER_DEPTH[num]) score += PITCHER_DEPTH[num];
  if (position === 'C' && CATCHER_DEPTH[num]) score += CATCHER_DEPTH[num];
  if (position === 'SS' && SS_DEPTH[num]) score += SS_DEPTH[num];
  if (position === '1B' && FIRSTBASE_DEPTH[num]) score += FIRSTBASE_DEPTH[num];

  // Layer on AI adjustments from game notes analysis
  if (aiAdjustments) {
    for (const adj of aiAdjustments) {
      if (adj.playerNumber === num && adj.position === position) {
        score += adj.adjustment;
      }
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// Batting order scoring
// ---------------------------------------------------------------------------
function battingScore(player: Player) {
  const { attributes, stats } = player;
  const obp = stats?.obp ?? 0;
  const avg = stats?.avg ?? 0;
  const ops = stats?.ops ?? 0;

  return {
    leadoff: obp * 100 + attributes.speed * 8 + attributes.baseballIQ * 5 + attributes.contactAbility * 3,
    middle: avg * 80 + obp * 60 + attributes.contactAbility * 6 + attributes.handEyeCoordination * 4 + attributes.power * 3,
    power: ops * 80 + attributes.power * 10 + attributes.contactAbility * 4 + (stats?.rbi ?? 0) * 3,
  };
}

// ---------------------------------------------------------------------------
// Bench priority (lower = sits first)
// ---------------------------------------------------------------------------
const TIER_BENCH_PRIORITY: Record<string, number> = {
  developmental: 0,
  potential: 1,
  'role-player': 2,
  star: 3,
};

// Star player jersey numbers — these players should barely sit
const STAR_PLAYER_NUMBERS = new Set([7, 9, 10]); // Rodney, Kellen, Carson

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const FIELD_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const;
const ACE_PITCH_INNINGS = 3;

export interface SuggestedLineup {
  battingOrder: number[];
  positionsByInning: string[][];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function idxByNum(allPlayers: Player[], num: number): number {
  return allPlayers.findIndex((p) => p.number === num);
}

function hasValue(locked: Map<string, number>, idx: number): boolean {
  for (const v of locked.values()) {
    if (v === idx) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main engine
// ---------------------------------------------------------------------------
export function suggestLineup(
  allPlayers: Player[],
  totalInnings: number,
  absentPlayerNumbers?: number[],
  lastGamePitcherNumbers?: number[],
  aiAdjustments?: AIAdjustment[],
): SuggestedLineup {
  // =========================================================================
  // Step 0: Filter out absent players
  // =========================================================================
  const absentSet = new Set(absentPlayerNumbers ?? []);
  const players = allPlayers.filter((p) => !absentSet.has(p.number));

  const n = players.length;

  // =========================================================================
  // Step 1: Batting order (pure attribute + stats scoring)
  // =========================================================================
  const scores = players.map((p, i) => ({ index: i, ...battingScore(p) }));
  const used = new Set<number>();
  const battingOrder: number[] = new Array(n);

  function pickBest(scoreFn: (s: (typeof scores)[0]) => number): number {
    let best = -1;
    let bestScore = -Infinity;
    for (const s of scores) {
      if (used.has(s.index)) continue;
      const v = scoreFn(s);
      if (v > bestScore) { bestScore = v; best = s.index; }
    }
    used.add(best);
    return best;
  }

  battingOrder[0] = pickBest((s) => s.leadoff);
  battingOrder[1] = pickBest((s) => s.middle);
  battingOrder[2] = pickBest((s) => s.middle);
  battingOrder[3] = pickBest((s) => s.power);
  battingOrder[4] = pickBest((s) => s.power);

  const remaining = scores
    .filter((s) => !used.has(s.index))
    .sort((a, b) => (b.leadoff + b.middle + b.power) - (a.leadoff + a.middle + a.power));
  for (let i = 0; i < remaining.length; i++) {
    battingOrder[5 + i] = remaining[i].index;
  }

  // =========================================================================
  // Step 2: Key player indices from depth charts
  // =========================================================================

  // --- Pitcher selection (respect last game's pitchers) ---
  // Pitchers who started last game drop to the bottom of the depth chart.
  // Not a hard rule — they CAN pitch, but we prefer fresh arms.
  const lastPitcherSet = new Set(lastGamePitcherNumbers ?? []);
  const pitcherDepthOrder = [7, 10, 9, 8, 11, 3, 5]; // full depth chart by jersey #

  // Sort: fresh pitchers first, last-game pitchers last (but still available)
  const sortedPitchers = [...pitcherDepthOrder].sort((a, b) => {
    const aUsed = lastPitcherSet.has(a) ? 1 : 0;
    const bUsed = lastPitcherSet.has(b) ? 1 : 0;
    if (aUsed !== bUsed) return aUsed - bUsed;
    return pitcherDepthOrder.indexOf(a) - pitcherDepthOrder.indexOf(b);
  });

  // Pick first two available pitchers from the sorted depth chart
  const availablePitchers = sortedPitchers
    .map((num) => idxByNum(players, num))
    .filter((idx) => idx !== -1);
  const aceIdx = availablePitchers[0] ?? -1;
  const secondPitcherIdx = availablePitchers[1] ?? -1;

  const strategicCatcherIdx = idxByNum(players, 4); // Stephoni (strategic default)
  const solidCatcherIdx = idxByNum(players, 8);     // Bennett (backup C)
  const bestCatcherIdx = idxByNum(players, 9);      // Kellen
  const primary1BIdx = idxByNum(players, 9);        // Kellen

  // =========================================================================
  // Step 3: Bench schedule
  // =========================================================================
  const benchSlots = n - FIELD_POSITIONS.length;
  const benchSchedule: Set<number>[] = Array.from({ length: totalInnings }, () => new Set());

  if (benchSlots > 0) {
    const benchCount = new Array(n).fill(0);

    // Stars default to 0 max bench; developmental/role-player sit more
    const maxBench: Record<string, number> = {
      star: 0,
      potential: 2,
      'role-player': 2,
      developmental: 3,
    };

    // Compute total bench-innings needed across the game
    const totalBenchInnings = benchSlots * totalInnings;

    // Check if we can fill all bench slots without stars
    const nonStarPlayers = players.filter((p) => !STAR_PLAYER_NUMBERS.has(p.number));
    const nonStarCapacity = nonStarPlayers.reduce((sum, p) => {
      return sum + (maxBench[p.tier] ?? 2);
    }, 0);

    // If non-stars can't cover all bench slots, allow stars to sit 1 inning each
    const starMaxBench = nonStarCapacity >= totalBenchInnings ? 0 : 1;

    for (let inn = 0; inn < totalInnings; inn++) {
      const candidates = players
        .map((p, i) => {
          const isStarPlayer = STAR_PLAYER_NUMBERS.has(p.number);
          const playerMax = isStarPlayer ? starMaxBench : (maxBench[p.tier] ?? 2);
          return {
            index: i,
            benchCount: benchCount[i],
            tierPriority: TIER_BENCH_PRIORITY[p.tier] ?? 2,
            maxBench: playerMax,
            isStarPlayer,
            overallSkill:
              p.attributes.fielding + p.attributes.contactAbility +
              p.attributes.power + p.attributes.baseballIQ + p.attributes.speed,
          };
        })
        .filter((c) => c.benchCount < c.maxBench)
        .sort((a, b) => {
          // Stars sit last — heavily deprioritize them
          if (a.isStarPlayer !== b.isStarPlayer) return a.isStarPlayer ? 1 : -1;
          if (a.benchCount !== b.benchCount) return a.benchCount - b.benchCount;
          if (a.tierPriority !== b.tierPriority) return a.tierPriority - b.tierPriority;
          return a.overallSkill - b.overallSkill;
        });

      const toBench = candidates.slice(0, benchSlots);
      for (const c of toBench) {
        benchSchedule[inn].add(c.index);
        benchCount[c.index]++;
      }

      if (toBench.length < benchSlots) {
        const fallback = players
          .map((p, i) => ({
            index: i,
            tierPriority: TIER_BENCH_PRIORITY[p.tier] ?? 2,
            isStarPlayer: STAR_PLAYER_NUMBERS.has(p.number),
          }))
          .filter((c) => !benchSchedule[inn].has(c.index))
          .sort((a, b) => {
            if (a.isStarPlayer !== b.isStarPlayer) return a.isStarPlayer ? 1 : -1;
            return a.tierPriority - b.tierPriority;
          });
        for (let f = 0; f < benchSlots - toBench.length && f < fallback.length; f++) {
          benchSchedule[inn].add(fallback[f].index);
          benchCount[fallback[f].index]++;
        }
      }
    }
  }

  // =========================================================================
  // Step 4: Position assignment per inning
  // =========================================================================
  const positionsByInning: string[][] = players.map(() =>
    new Array(totalInnings).fill('BN'),
  );

  for (let inn = 0; inn < totalInnings; inn++) {
    const benched = benchSchedule[inn];
    const fieldPlayers = players.map((_, i) => i).filter((i) => !benched.has(i));
    const locked = new Map<string, number>();
    const isPlaying = (idx: number) => idx !== -1 && fieldPlayers.includes(idx);

    // --- PITCHER (consecutive innings, no gaps) ---
    // Ace (Rodney #7) pitches innings 1-3 (indices 0-2) consecutively
    // Second pitcher (Carson #10) pitches innings 4-6 (indices 3-5) consecutively
    if (inn < ACE_PITCH_INNINGS) {
      if (isPlaying(aceIdx)) {
        locked.set('P', aceIdx);
      }
    } else {
      if (isPlaying(secondPitcherIdx)) {
        locked.set('P', secondPitcherIdx);
      }
    }

    // --- SS (best available from SS depth chart who isn't pitching) ---
    if (!locked.has('SS')) {
      const ssDepth = [7, 10, 8]; // Rodney, Carson, Bennett
      for (const num of ssDepth) {
        const idx = idxByNum(players, num);
        if (idx !== -1 && isPlaying(idx) && !hasValue(locked, idx)) {
          locked.set('SS', idx);
          break;
        }
      }
    }

    // --- CATCHER (consistent — one catcher for most of the game) ---
    // Bennett is the solid reliable default. Catches innings 1-4.
    // Kellen catches innings 5-6 (2 innings to stay sharp, not overused).
    // Stephoni available as strategic option but not auto-assigned with ace.
    if (!locked.has('C')) {
      if (inn < 4 && isPlaying(solidCatcherIdx) && !hasValue(locked, solidCatcherIdx)) {
        // Bennett catches innings 1-4
        locked.set('C', solidCatcherIdx);
      } else if (inn >= 4 && isPlaying(bestCatcherIdx) && !hasValue(locked, bestCatcherIdx)) {
        // Kellen catches innings 5-6
        locked.set('C', bestCatcherIdx);
      } else if (isPlaying(solidCatcherIdx) && !hasValue(locked, solidCatcherIdx)) {
        // Fallback to Bennett
        locked.set('C', solidCatcherIdx);
      } else if (isPlaying(strategicCatcherIdx) && !hasValue(locked, strategicCatcherIdx)) {
        // Last resort: Stephoni
        locked.set('C', strategicCatcherIdx);
      }
    }

    // --- 1B (Kellen when not catching) ---
    if (!locked.has('1B') && isPlaying(primary1BIdx) && !hasValue(locked, primary1BIdx)) {
      locked.set('1B', primary1BIdx);
    }
    // Fallback 1B: Carson if not pitching/SS
    if (!locked.has('1B')) {
      const carsonIdx = idxByNum(players, 10);
      if (isPlaying(carsonIdx) && !hasValue(locked, carsonIdx)) {
        locked.set('1B', carsonIdx);
      }
    }

    // --- Everything else assigned by attribute + depth chart scoring ---
    assignPositions(players, fieldPlayers, inn, positionsByInning, locked, aiAdjustments);

    for (const bi of benched) {
      positionsByInning[bi][inn] = 'BN';
    }
  }

  return { battingOrder, positionsByInning };
}

// ---------------------------------------------------------------------------
// Greedy position assignment with locked positions
// ---------------------------------------------------------------------------
function assignPositions(
  allPlayers: Player[],
  fieldPlayerIndices: number[],
  inning: number,
  positionsByInning: string[][],
  locked: Map<string, number> = new Map(),
  aiAdjustments?: AIAdjustment[],
) {
  const available = new Set(fieldPlayerIndices);
  const filledPositions = new Set<string>();

  for (const [pos, playerIdx] of locked) {
    if (available.has(playerIdx)) {
      positionsByInning[playerIdx][inning] = pos;
      filledPositions.add(pos);
      available.delete(playerIdx);
    }
  }

  const combos: { pos: string; playerIdx: number; score: number }[] = [];
  for (const pos of FIELD_POSITIONS) {
    if (filledPositions.has(pos)) continue;
    for (const pi of available) {
      combos.push({ pos, playerIdx: pi, score: positionFitScore(allPlayers[pi], pos, aiAdjustments) });
    }
  }

  combos.sort((a, b) => b.score - a.score);

  for (const combo of combos) {
    if (filledPositions.has(combo.pos)) continue;
    if (!available.has(combo.playerIdx)) continue;
    positionsByInning[combo.playerIdx][inning] = combo.pos;
    filledPositions.add(combo.pos);
    available.delete(combo.playerIdx);
    if (filledPositions.size === FIELD_POSITIONS.length) break;
  }

  for (const pi of available) {
    for (const pos of FIELD_POSITIONS) {
      if (!filledPositions.has(pos)) {
        positionsByInning[pi][inning] = pos;
        filledPositions.add(pos);
        break;
      }
    }
  }
}
