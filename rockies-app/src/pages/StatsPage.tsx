import { useState, useMemo } from 'react';
import { BarChart3, Trophy, ArrowUpDown, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { usePlayers } from '@/context/PlayersContext';
import type { Player } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(val: number, decimals = 3): string {
  if (decimals === 3) return val.toFixed(3).replace(/^0/, '');
  return val.toFixed(decimals);
}

function fmtInt(val: number): string {
  return String(val);
}

// ---------------------------------------------------------------------------
// Team aggregates
// ---------------------------------------------------------------------------
function computeTeamStats(battingPlayers: Player[]) {
  let totalHits = 0;
  let totalAB = 0;
  let totalPA = 0;
  let totalBB = 0;
  let totalHBP = 0;
  let totalRuns = 0;
  let totalSingles = 0;
  let totalDoubles = 0;
  let totalTriples = 0;
  let totalHR = 0;

  for (const p of battingPlayers) {
    const s = p.stats!;
    totalHits += s.hits;
    totalAB += s.ab;
    totalPA += s.pa;
    totalBB += s.bb;
    totalHBP += s.hbp;
    totalRuns += s.runs;
    totalSingles += s.singles;
    totalDoubles += s.doubles;
    totalTriples += s.triples;
    totalHR += s.hr;
  }

  const avg = totalAB > 0 ? totalHits / totalAB : 0;
  const obp = totalPA > 0 ? (totalHits + totalBB + totalHBP) / totalPA : 0;
  const totalBases = totalSingles + totalDoubles * 2 + totalTriples * 3 + totalHR * 4;
  const slg = totalAB > 0 ? totalBases / totalAB : 0;
  const ops = obp + slg;

  // Compute games played (max GP across all players)
  const gamesPlayed = battingPlayers.reduce((max, p) => Math.max(max, p.stats?.gp ?? 0), 0);
  const runsPerGame = gamesPlayed > 0 ? totalRuns / gamesPlayed : 0;

  return { avg, obp, ops, totalRuns, runsPerGame, gamesPlayed };
}

// ---------------------------------------------------------------------------
// Batting columns definition
// ---------------------------------------------------------------------------
type BattingKey =
  | 'number'
  | 'name'
  | 'gp'
  | 'avg'
  | 'obp'
  | 'slg'
  | 'ops'
  | 'hits'
  | 'doubles'
  | 'triples'
  | 'hr'
  | 'rbi'
  | 'runs'
  | 'bb'
  | 'so'
  | 'kl'
  | 'sb'
  | 'qab'
  | 'barisp'
  | 'lob';

interface BattingColumn {
  key: BattingKey;
  label: string;
  getValue: (p: Player) => number | string;
  getNumericValue: (p: Player) => number;
  format: (v: number) => string;
  higherIsBetter: boolean;
  isRate: boolean;
}

const BATTING_COLUMNS: BattingColumn[] = [
  { key: 'number', label: '#', getValue: (p) => p.number, getNumericValue: (p) => p.number, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'name', label: 'Name', getValue: (p) => `${p.firstName} ${p.lastName.charAt(0)}.`, getNumericValue: () => 0, format: () => '', higherIsBetter: true, isRate: false },
  { key: 'gp', label: 'GP', getValue: (p) => p.stats?.gp ?? 0, getNumericValue: (p) => p.stats?.gp ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'avg', label: 'AVG', getValue: (p) => p.stats?.avg ?? 0, getNumericValue: (p) => p.stats?.avg ?? 0, format: (v) => fmt(v), higherIsBetter: true, isRate: true },
  { key: 'obp', label: 'OBP', getValue: (p) => p.stats?.obp ?? 0, getNumericValue: (p) => p.stats?.obp ?? 0, format: (v) => fmt(v), higherIsBetter: true, isRate: true },
  { key: 'slg', label: 'SLG', getValue: (p) => p.stats?.slg ?? 0, getNumericValue: (p) => p.stats?.slg ?? 0, format: (v) => fmt(v), higherIsBetter: true, isRate: true },
  { key: 'ops', label: 'OPS', getValue: (p) => p.stats?.ops ?? 0, getNumericValue: (p) => p.stats?.ops ?? 0, format: (v) => fmt(v), higherIsBetter: true, isRate: true },
  { key: 'hits', label: 'H', getValue: (p) => p.stats?.hits ?? 0, getNumericValue: (p) => p.stats?.hits ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'doubles', label: '2B', getValue: (p) => p.stats?.doubles ?? 0, getNumericValue: (p) => p.stats?.doubles ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'triples', label: '3B', getValue: (p) => p.stats?.triples ?? 0, getNumericValue: (p) => p.stats?.triples ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'hr', label: 'HR', getValue: (p) => p.stats?.hr ?? 0, getNumericValue: (p) => p.stats?.hr ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'rbi', label: 'RBI', getValue: (p) => p.stats?.rbi ?? 0, getNumericValue: (p) => p.stats?.rbi ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'runs', label: 'R', getValue: (p) => p.stats?.runs ?? 0, getNumericValue: (p) => p.stats?.runs ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'bb', label: 'BB', getValue: (p) => p.stats?.bb ?? 0, getNumericValue: (p) => p.stats?.bb ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'so', label: 'SO', getValue: (p) => p.stats?.so ?? 0, getNumericValue: (p) => p.stats?.so ?? 0, format: fmtInt, higherIsBetter: false, isRate: false },
  { key: 'kl', label: 'K-L', getValue: (p) => p.stats?.kl ?? 0, getNumericValue: (p) => p.stats?.kl ?? 0, format: fmtInt, higherIsBetter: false, isRate: false },
  { key: 'sb', label: 'SB', getValue: (p) => p.stats?.sb ?? 0, getNumericValue: (p) => p.stats?.sb ?? 0, format: fmtInt, higherIsBetter: true, isRate: false },
  { key: 'qab', label: 'QAB%', getValue: (p) => p.stats?.qab ?? 0, getNumericValue: (p) => p.stats?.qab ?? 0, format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true, isRate: true },
  { key: 'barisp', label: 'BA/RISP', getValue: (p) => p.stats?.barisp ?? 0, getNumericValue: (p) => p.stats?.barisp ?? 0, format: (v) => fmt(v), higherIsBetter: true, isRate: true },
  { key: 'lob', label: 'LOB', getValue: (p) => p.stats?.lob ?? 0, getNumericValue: (p) => p.stats?.lob ?? 0, format: fmtInt, higherIsBetter: false, isRate: false },
];

// ---------------------------------------------------------------------------
// Pitching columns definition
// ---------------------------------------------------------------------------
type PitchingKey = 'name' | 'ip' | 'era' | 'whip' | 'pHits' | 'pBB' | 'pSO' | 'baa';

interface PitchingColumn {
  key: PitchingKey;
  label: string;
  getValue: (p: Player) => number | string;
  getNumericValue: (p: Player) => number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

const PITCHING_COLUMNS: PitchingColumn[] = [
  { key: 'name', label: 'Name', getValue: (p) => `${p.firstName} ${p.lastName.charAt(0)}.`, getNumericValue: () => 0, format: () => '', higherIsBetter: true },
  { key: 'ip', label: 'IP', getValue: (p) => p.pitchingStats?.ip ?? 0, getNumericValue: (p) => p.pitchingStats?.ip ?? 0, format: (v) => fmt(v, 1), higherIsBetter: true },
  { key: 'era', label: 'ERA', getValue: (p) => p.pitchingStats?.era ?? 0, getNumericValue: (p) => p.pitchingStats?.era ?? 0, format: (v) => fmt(v, 2), higherIsBetter: false },
  { key: 'whip', label: 'WHIP', getValue: (p) => p.pitchingStats?.whip ?? 0, getNumericValue: (p) => p.pitchingStats?.whip ?? 0, format: (v) => fmt(v, 2), higherIsBetter: false },
  { key: 'pHits', label: 'H', getValue: (p) => p.pitchingStats?.hits ?? 0, getNumericValue: (p) => p.pitchingStats?.hits ?? 0, format: fmtInt, higherIsBetter: false },
  { key: 'pBB', label: 'BB', getValue: (p) => p.pitchingStats?.bb ?? 0, getNumericValue: (p) => p.pitchingStats?.bb ?? 0, format: fmtInt, higherIsBetter: false },
  { key: 'pSO', label: 'SO', getValue: (p) => p.pitchingStats?.so ?? 0, getNumericValue: (p) => p.pitchingStats?.so ?? 0, format: fmtInt, higherIsBetter: true },
  { key: 'baa', label: 'BAA', getValue: (p) => p.pitchingStats?.baa ?? 0, getNumericValue: (p) => p.pitchingStats?.baa ?? 0, format: (v) => fmt(v), higherIsBetter: false },
];

// ---------------------------------------------------------------------------
// Leaderboard categories
// ---------------------------------------------------------------------------
interface LeaderCategory {
  label: string;
  getValue: (p: Player) => number;
  format: (v: number) => string;
  lowerIsBetter?: boolean;
}

const LEADER_CATEGORIES: LeaderCategory[] = [
  { label: 'AVG', getValue: (p) => p.stats?.avg ?? 0, format: (v) => fmt(v) },
  { label: 'OBP', getValue: (p) => p.stats?.obp ?? 0, format: (v) => fmt(v) },
  { label: 'OPS', getValue: (p) => p.stats?.ops ?? 0, format: (v) => fmt(v) },
  { label: 'XBH', getValue: (p) => (p.stats?.doubles ?? 0) + (p.stats?.triples ?? 0) + (p.stats?.hr ?? 0), format: fmtInt },
  { label: 'RBI', getValue: (p) => p.stats?.rbi ?? 0, format: fmtInt },
  { label: 'SB', getValue: (p) => p.stats?.sb ?? 0, format: fmtInt },
  { label: 'QAB%', getValue: (p) => p.stats?.qab ?? 0, format: (v) => `${v.toFixed(1)}%` },
  { label: 'BA/RISP', getValue: (p) => p.stats?.barisp ?? 0, format: (v) => fmt(v) },
  { label: 'SO', getValue: (p) => p.stats?.so ?? 0, format: fmtInt, lowerIsBetter: true },
  { label: 'LOB', getValue: (p) => p.stats?.lob ?? 0, format: fmtInt, lowerIsBetter: true },
];

function getLeaders(cat: LeaderCategory, battingPlayers: Player[]) {
  return [...battingPlayers]
    .sort((a, b) =>
      cat.lowerIsBetter
        ? cat.getValue(a) - cat.getValue(b)
        : cat.getValue(b) - cat.getValue(a),
    )
    .slice(0, 3);
}

// ---------------------------------------------------------------------------
// Needs Improvement categories (bottom performers)
// ---------------------------------------------------------------------------
interface NeedsImprovementCategory {
  label: string;
  getValue: (p: Player) => number;
  format: (v: number) => string;
  /** If true, HIGHEST values are worst (e.g. strikeouts). Otherwise lowest values are worst. */
  highestIsWorst: boolean;
}

const NEEDS_IMPROVEMENT_CATEGORIES: NeedsImprovementCategory[] = [
  { label: 'QAB%', getValue: (p) => p.stats?.qab ?? 0, format: (v) => `${v.toFixed(1)}%`, highestIsWorst: false },
  { label: 'BA/RISP', getValue: (p) => p.stats?.barisp ?? 0, format: (v) => fmt(v), highestIsWorst: false },
  { label: 'OBP', getValue: (p) => p.stats?.obp ?? 0, format: (v) => fmt(v), highestIsWorst: false },
  { label: 'SO', getValue: (p) => p.stats?.so ?? 0, format: fmtInt, highestIsWorst: true },
];

function getBottomPerformers(cat: NeedsImprovementCategory, battingPlayers: Player[]) {
  return [...battingPlayers]
    .sort((a, b) =>
      cat.highestIsWorst
        ? cat.getValue(b) - cat.getValue(a)   // most strikeouts first
        : cat.getValue(a) - cat.getValue(b),   // lowest QAB%/BA-RISP/OBP first
    )
    .slice(0, 3);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function StatsPage() {
  const { players } = usePlayers();
  const battingPlayers = useMemo(() => players.filter((p) => p.stats), [players]);
  const pitchingPlayers = useMemo(() => players.filter((p) => p.pitchingStats), [players]);
  const teamStats = useMemo(() => computeTeamStats(battingPlayers), [battingPlayers]);
  const [battingSortKey, setBattingSortKey] = useState<BattingKey>('ops');
  const [battingSortDir, setBattingSortDir] = useState<'asc' | 'desc'>('desc');
  const [pitchingSortKey, setPitchingSortKey] = useState<PitchingKey>('era');
  const [pitchingSortDir, setPitchingSortDir] = useState<'asc' | 'desc'>('asc');

  // Sort batting players
  const sortedBatting = useMemo(() => {
    const col = BATTING_COLUMNS.find((c) => c.key === battingSortKey)!;
    return [...battingPlayers].sort((a, b) => {
      const aVal = col.getNumericValue(a);
      const bVal = col.getNumericValue(b);
      return battingSortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [battingSortKey, battingSortDir]);

  // Sort pitching players
  const sortedPitching = useMemo(() => {
    const col = PITCHING_COLUMNS.find((c) => c.key === pitchingSortKey)!;
    return [...pitchingPlayers].sort((a, b) => {
      const aVal = col.getNumericValue(a);
      const bVal = col.getNumericValue(b);
      return pitchingSortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [pitchingSortKey, pitchingSortDir]);

  // Best values for highlighting (batting)
  const bestBattingValues = useMemo(() => {
    const bests: Record<string, number> = {};
    for (const col of BATTING_COLUMNS) {
      if (col.key === 'number' || col.key === 'name' || col.key === 'gp') continue;
      const vals = battingPlayers.map((p) => col.getNumericValue(p));
      bests[col.key] = col.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    }
    return bests;
  }, []);

  // Best values for highlighting (pitching)
  const bestPitchingValues = useMemo(() => {
    const bests: Record<string, number> = {};
    for (const col of PITCHING_COLUMNS) {
      if (col.key === 'name') continue;
      const vals = pitchingPlayers.map((p) => col.getNumericValue(p));
      bests[col.key] = col.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    }
    return bests;
  }, []);

  function handleBattingSort(key: BattingKey) {
    if (key === 'name' || key === 'number') return;
    if (battingSortKey === key) {
      setBattingSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setBattingSortKey(key);
      const col = BATTING_COLUMNS.find((c) => c.key === key)!;
      setBattingSortDir(col.higherIsBetter ? 'desc' : 'asc');
    }
  }

  function handlePitchingSort(key: PitchingKey) {
    if (key === 'name') return;
    if (pitchingSortKey === key) {
      setPitchingSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setPitchingSortKey(key);
      const col = PITCHING_COLUMNS.find((c) => c.key === key)!;
      setPitchingSortDir(col.higherIsBetter ? 'desc' : 'asc');
    }
  }

  const rankBadge = (i: number) => {
    const colors = [
      'bg-yellow-400 text-yellow-900',
      'bg-gray-300 text-gray-700',
      'bg-amber-600 text-amber-100',
    ];
    return (
      <span
        className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${colors[i]}`}
      >
        {i + 1}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rockies-purple/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-rockies-purple" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-rockies-black">
            Team Stats
          </h1>
          <p className="text-xs text-rockies-black/50">
            Spring 2026 Season — {teamStats.gamesPlayed} games played
          </p>
        </div>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Team AVG', value: fmt(teamStats.avg) },
          { label: 'Team OBP', value: fmt(teamStats.obp) },
          { label: 'Team OPS', value: fmt(teamStats.ops) },
          { label: 'Runs / Game', value: fmt(teamStats.runsPerGame, 1) },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-gradient-to-br from-rockies-purple/5 to-rockies-purple/15 rounded-xl border border-rockies-purple/10 p-4"
          >
            <p className="text-xs font-medium text-rockies-purple/70 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-3xl font-heading font-bold text-rockies-purple mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Batting Leaders */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-rockies-purple" />
          <h2 className="font-heading font-bold text-lg text-rockies-black">
            Batting Leaders
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {LEADER_CATEGORIES.map((cat) => {
            const leaders = getLeaders(cat, battingPlayers);
            return (
              <div
                key={cat.label}
                className="bg-gray-50 rounded-xl border border-gray-200/60 shadow-sm overflow-hidden"
              >
                <div className="bg-gray-200/80 px-4 py-1.5">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {cat.label}
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  {leaders.map((p, i) => (
                    <div key={p.number} className="flex items-center gap-2">
                      {rankBadge(i)}
                      <span className="text-sm text-rockies-black truncate flex-1">
                        {p.firstName} {p.lastName.charAt(0)}.
                      </span>
                      <span className="text-sm font-bold text-rockies-purple">
                        {cat.format(cat.getValue(p))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Needs Improvement */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="font-heading font-bold text-lg text-rockies-black">
            Development Focus
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {NEEDS_IMPROVEMENT_CATEGORIES.map((cat) => {
            const bottom = getBottomPerformers(cat, battingPlayers);
            return (
              <div
                key={cat.label}
                className="bg-amber-50 rounded-xl border border-amber-200/60 shadow-sm overflow-hidden"
              >
                <div className="bg-amber-400/80 px-4 py-1.5">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    {cat.label}
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  {bottom.map((p, i) => (
                    <div key={p.number} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-amber-200 text-amber-800">
                        {i + 1}
                      </span>
                      <span className="text-sm text-rockies-black truncate flex-1">
                        {p.firstName} {p.lastName.charAt(0)}.
                      </span>
                      <span className="text-sm font-bold text-amber-700">
                        {cat.format(cat.getValue(p))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Batting Stats Table */}
      <div>
        <h2 className="font-heading font-bold text-lg text-rockies-black mb-3">
          Batting Stats
        </h2>
        <div className="bg-white rounded-xl border border-rockies-silver/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rockies-purple/5 sticky top-0 z-30">
                  {BATTING_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleBattingSort(col.key)}
                      className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                        col.key === 'name' || col.key === 'number'
                          ? 'text-rockies-black/70'
                          : 'text-rockies-black/70 cursor-pointer hover:text-rockies-purple select-none'
                      } ${col.key === 'number' ? 'sticky left-0 z-30 bg-[#f6f3f9] w-8' : ''} ${col.key === 'name' ? 'sticky left-[32px] z-30 bg-[#f6f3f9] min-w-[120px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {battingSortKey === col.key && col.key !== 'name' && col.key !== 'number' && (
                          battingSortDir === 'desc' ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronUp className="w-3 h-3" />
                          )
                        )}
                        {col.key !== 'name' && col.key !== 'number' && battingSortKey !== col.key && (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedBatting.map((player, idx) => {
                  const rowBg = idx % 2 === 1 ? '#faf9fc' : '#ffffff';
                  return (
                  <tr
                    key={player.number}
                    className={`border-t border-rockies-silver/10 ${
                      idx % 2 === 1 ? 'bg-[#faf9fc]' : 'bg-white'
                    } hover:bg-rockies-purple/5 transition-colors group`}
                  >
                    {BATTING_COLUMNS.map((col) => {
                      const raw = col.getValue(player);
                      const numVal = col.getNumericValue(player);
                      const isBest =
                        col.key !== 'number' &&
                        col.key !== 'name' &&
                        col.key !== 'gp' &&
                        numVal === bestBattingValues[col.key] &&
                        numVal !== 0;

                      let display: string;
                      if (col.key === 'name' || col.key === 'number') {
                        display = String(raw);
                      } else {
                        display = col.format(numVal);
                      }

                      return (
                        <td
                          key={col.key}
                          style={col.key === 'number' || col.key === 'name' ? { backgroundColor: rowBg } : undefined}
                          className={`px-3 py-2 whitespace-nowrap ${
                            isBest ? 'text-rockies-purple font-bold' : 'text-rockies-black'
                          } ${col.key === 'number' ? 'sticky left-0 z-10 group-hover:!bg-rockies-purple/5' : ''} ${col.key === 'name' ? 'sticky left-[32px] z-10 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:!bg-rockies-purple/5' : ''}`}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pitching Stats Table */}
      <div>
        <h2 className="font-heading font-bold text-lg text-rockies-black mb-3">
          Pitching Stats
        </h2>
        <div className="bg-white rounded-xl border border-rockies-silver/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rockies-purple/5 sticky top-0 z-30">
                  {PITCHING_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handlePitchingSort(col.key)}
                      className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                        col.key === 'name'
                          ? 'text-rockies-black/70 sticky left-0 z-30 bg-[#f6f3f9] min-w-[120px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]'
                          : 'text-rockies-black/70 cursor-pointer hover:text-rockies-purple select-none'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {pitchingSortKey === col.key && col.key !== 'name' && (
                          pitchingSortDir === 'desc' ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronUp className="w-3 h-3" />
                          )
                        )}
                        {col.key !== 'name' && pitchingSortKey !== col.key && (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPitching.map((player, idx) => {
                  const rowBg = idx % 2 === 1 ? '#faf9fc' : '#ffffff';
                  return (
                  <tr
                    key={player.number}
                    className={`border-t border-rockies-silver/10 ${
                      idx % 2 === 1 ? 'bg-[#faf9fc]' : 'bg-white'
                    } hover:bg-rockies-purple/5 transition-colors group`}
                  >
                    {PITCHING_COLUMNS.map((col) => {
                      const raw = col.getValue(player);
                      const numVal = col.getNumericValue(player);
                      const isBest =
                        col.key !== 'name' &&
                        numVal === bestPitchingValues[col.key] &&
                        numVal !== 0;

                      let display: string;
                      if (col.key === 'name') {
                        display = String(raw);
                      } else {
                        display = col.format(numVal);
                      }

                      return (
                        <td
                          key={col.key}
                          style={col.key === 'name' ? { backgroundColor: rowBg } : undefined}
                          className={`px-4 py-2.5 whitespace-nowrap ${
                            isBest ? 'text-rockies-purple font-bold' : 'text-rockies-black'
                          } ${col.key === 'name' ? 'sticky left-0 z-10 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] group-hover:!bg-rockies-purple/5' : ''}`}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
