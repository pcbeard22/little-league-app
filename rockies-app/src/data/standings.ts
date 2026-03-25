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

// Updated 2026-03-25 from Game Changer screenshot (high-res)
export const STANDINGS: TeamStanding[] = [
  { team: 'White Sox',  wins: 4, losses: 0, ties: 1, pct: .900, gb: '-',   runsFor: 30, runsAgainst: 21, diff: 9,   streak: 'W3', home: '2-0',   away: '2-0-1' },
  { team: 'Giants',     wins: 4, losses: 1, ties: 0, pct: .800, gb: '0.5', runsFor: 40, runsAgainst: 20, diff: 20,  streak: 'W3', home: '2-0',   away: '2-1' },
  { team: "A's",        wins: 4, losses: 1, ties: 0, pct: .800, gb: '0.5', runsFor: 39, runsAgainst: 27, diff: 12,  streak: 'W2', home: '1-1',   away: '3-0' },
  { team: 'Dodgers',    wins: 3, losses: 1, ties: 1, pct: .700, gb: '1.0', runsFor: 38, runsAgainst: 23, diff: 15,  streak: 'W1', home: '1-0-1', away: '2-1' },
  { team: 'Pirates',    wins: 3, losses: 2, ties: 0, pct: .600, gb: '1.5', runsFor: 28, runsAgainst: 29, diff: -1,  streak: 'W2', home: '2-1',   away: '1-1' },
  { team: 'Cubs',       wins: 2, losses: 2, ties: 2, pct: .500, gb: '2.0', runsFor: 36, runsAgainst: 36, diff: 0,   streak: 'W1', home: '2-1',   away: '0-1-2' },
  { team: 'Orioles',    wins: 2, losses: 2, ties: 1, pct: .500, gb: '2.0', runsFor: 22, runsAgainst: 24, diff: -2,  streak: 'W1', home: '0-1-1', away: '2-1' },
  { team: 'Braves',     wins: 1, losses: 2, ties: 2, pct: .400, gb: '2.5', runsFor: 29, runsAgainst: 28, diff: 1,   streak: 'L1', home: '0-2-1', away: '1-0-1' },
  { team: 'Astros',     wins: 2, losses: 3, ties: 0, pct: .400, gb: '2.5', runsFor: 18, runsAgainst: 26, diff: -8,  streak: 'L2', home: '1-2',   away: '1-1' },
  { team: 'Rockies',    wins: 2, losses: 3, ties: 1, pct: .417, gb: '2.5', runsFor: 36, runsAgainst: 46, diff: -10, streak: 'W1', home: '1-2-1', away: '1-1' },
  { team: 'Tigers',     wins: 2, losses: 4, ties: 0, pct: .333, gb: '3.0', runsFor: 46, runsAgainst: 42, diff: 4,   streak: 'L2', home: '1-1',   away: '1-3' },
  { team: 'Cardinals',  wins: 1, losses: 3, ties: 2, pct: .333, gb: '3.0', runsFor: 27, runsAgainst: 36, diff: -9,  streak: 'L2', home: '0-2-1', away: '1-1-1' },
  { team: 'Reds',       wins: 1, losses: 4, ties: 0, pct: .200, gb: '3.5', runsFor: 23, runsAgainst: 30, diff: -7,  streak: 'W1', home: '0-3',   away: '1-1' },
  { team: 'Red Sox',    wins: 1, losses: 4, ties: 0, pct: .200, gb: '3.5', runsFor: 29, runsAgainst: 52, diff: -23, streak: 'L4', home: '1-2',   away: '0-2' },
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
