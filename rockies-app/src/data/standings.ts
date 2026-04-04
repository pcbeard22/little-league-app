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

// Updated 2026-04-04 from Game Changer screenshot
export const STANDINGS: TeamStanding[] = [
  { team: 'Dodgers',    wins: 6, losses: 1, ties: 1, pct: .813, gb: '-',   runsFor: 63, runsAgainst: 31, diff: 32,  streak: 'W4', home: '3-0-1', away: '3-1' },
  { team: 'Giants',     wins: 6, losses: 2, ties: 0, pct: .750, gb: '0.5', runsFor: 63, runsAgainst: 34, diff: 29,  streak: 'W1', home: '3-1',   away: '3-1' },
  { team: 'White Sox',  wins: 5, losses: 2, ties: 1, pct: .688, gb: '1.0', runsFor: 40, runsAgainst: 37, diff: 3,   streak: 'L2', home: '3-1',   away: '2-1-1' },
  { team: "A's",        wins: 5, losses: 2, ties: 1, pct: .688, gb: '1.0', runsFor: 58, runsAgainst: 57, diff: 1,   streak: 'T1', home: '1-2-1', away: '4-0' },
  { team: 'Braves',     wins: 3, losses: 3, ties: 2, pct: .500, gb: '2.5', runsFor: 55, runsAgainst: 40, diff: 15,  streak: 'L1', home: '1-2-1', away: '2-1-1' },
  { team: 'Cubs',       wins: 3, losses: 3, ties: 2, pct: .500, gb: '2.5', runsFor: 48, runsAgainst: 45, diff: 3,   streak: 'L1', home: '2-2',   away: '1-1-2' },
  { team: 'Cardinals',  wins: 3, losses: 3, ties: 2, pct: .500, gb: '2.5', runsFor: 42, runsAgainst: 42, diff: 0,   streak: 'W2', home: '1-2-1', away: '2-1-1' },
  { team: 'Pirates',    wins: 4, losses: 4, ties: 0, pct: .500, gb: '2.5', runsFor: 47, runsAgainst: 59, diff: -12, streak: 'L1', home: '2-3',   away: '2-1' },
  { team: 'Rockies',    wins: 3, losses: 4, ties: 1, pct: .438, gb: '3.0', runsFor: 53, runsAgainst: 64, diff: -11, streak: 'W1', home: '1-3-1', away: '2-1' },
  { team: 'Tigers',     wins: 3, losses: 5, ties: 0, pct: .375, gb: '3.5', runsFor: 61, runsAgainst: 58, diff: 3,   streak: 'W1', home: '2-1',   away: '1-4' },
  { team: 'Orioles',    wins: 2, losses: 4, ties: 2, pct: .375, gb: '3.5', runsFor: 40, runsAgainst: 48, diff: -8,  streak: 'T1', home: '0-2-1', away: '2-2-1' },
  { team: 'Astros',     wins: 3, losses: 5, ties: 0, pct: .375, gb: '3.5', runsFor: 30, runsAgainst: 40, diff: -10, streak: 'W1', home: '1-3',   away: '2-2' },
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
