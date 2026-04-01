export interface TeamStanding {
  team: string;
  wins: number;
  losses: number;
  ties: number;
  pct: number;
  gb: string;
  runsFor: number;
  runsAgainst: number;
  diff: number;
  streak: string;
  home: string;
  away: string;
}

// Updated 2026-04-01 from Game Changer screenshot
export const STANDINGS: TeamStanding[] = [
  { team: 'Dodgers',    wins: 6, losses: 1, ties: 1, pct: .813, gb: '-',   runsFor: 63, runsAgainst: 31, diff: 32,  streak: 'W4', home: '3-0-1', away: '3-1' },
  { team: 'White Sox',  wins: 5, losses: 1, ties: 1, pct: .786, gb: '0.5', runsFor: 39, runsAgainst: 30, diff: 9,   streak: 'L1', home: '3-0',   away: '2-1-1' },
  { team: 'Giants',     wins: 5, losses: 2, ties: 0, pct: .714, gb: '1.0', runsFor: 56, runsAgainst: 33, diff: 23,  streak: 'L1', home: '3-1',   away: '2-1' },
  { team: "A's",        wins: 5, losses: 2, ties: 0, pct: .714, gb: '1.0', runsFor: 49, runsAgainst: 48, diff: 1,   streak: 'W1', home: '1-2',   away: '4-0' },
  { team: 'Braves',     wins: 3, losses: 2, ties: 2, pct: .571, gb: '2.0', runsFor: 47, runsAgainst: 29, diff: 18,  streak: 'W2', home: '1-2-1', away: '2-0-1' },
  { team: 'Cubs',       wins: 3, losses: 2, ties: 2, pct: .571, gb: '2.0', runsFor: 44, runsAgainst: 39, diff: 5,   streak: 'W2', home: '2-1',   away: '1-1-2' },
  { team: 'Pirates',    wins: 4, losses: 3, ties: 0, pct: .571, gb: '2.0', runsFor: 42, runsAgainst: 46, diff: -4,  streak: 'W1', home: '2-2',   away: '2-1' },
  { team: 'Cardinals',  wins: 3, losses: 3, ties: 2, pct: .500, gb: '2.5', runsFor: 42, runsAgainst: 42, diff: 0,   streak: 'W2', home: '1-2-1', away: '2-1-1' },
  { team: 'Orioles',    wins: 2, losses: 4, ties: 1, pct: .357, gb: '3.5', runsFor: 31, runsAgainst: 39, diff: -8,  streak: 'L2', home: '0-2-1', away: '2-2' },
  { team: 'Rockies',    wins: 2, losses: 4, ties: 1, pct: .357, gb: '3.5', runsFor: 40, runsAgainst: 59, diff: -19, streak: 'L1', home: '1-3-1', away: '1-1' },
  { team: 'Tigers',     wins: 2, losses: 5, ties: 0, pct: .286, gb: '4.0', runsFor: 50, runsAgainst: 50, diff: 0,   streak: 'L3', home: '1-1',   away: '1-4' },
  { team: 'Astros',     wins: 2, losses: 5, ties: 0, pct: .286, gb: '4.0', runsFor: 24, runsAgainst: 36, diff: -12, streak: 'L4', home: '1-3',   away: '1-2' },
  { team: 'Reds',       wins: 2, losses: 6, ties: 0, pct: .250, gb: '4.5', runsFor: 36, runsAgainst: 51, diff: -15, streak: 'L1', home: '1-3',   away: '1-3' },
  { team: 'Red Sox',    wins: 2, losses: 6, ties: 0, pct: .250, gb: '4.5', runsFor: 48, runsAgainst: 76, diff: -28, streak: 'L2', home: '1-3',   away: '1-3' },
];

// Helper: get sorted standings (by pct descending, then diff descending)
export function getSortedStandings(): TeamStanding[] {
  return [...STANDINGS].sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct;
    return b.diff - a.diff;
  });
}

// Helper: find a team's standing by team name
export function getTeamRecord(teamName: string): TeamStanding | undefined {
  return STANDINGS.find(
    (s) => s.team.toLowerCase() === teamName.toLowerCase(),
  );
}

// Helper: format record string like "1-2-1"
export function formatRecord(s: TeamStanding): string {
  if (s.wins + s.losses + s.ties === 0) return '0-0';
  if (s.ties > 0) return `${s.wins}-${s.losses}-${s.ties}`;
  return `${s.wins}-${s.losses}`;
}
