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

// Updated 2026-04-11 from Game Changer screenshot
export const STANDINGS: TeamStanding[] = [
  { team: 'Dodgers',         wins: 8, losses: 2, ties: 1, pct: .773, gb: '-',   runsFor: 82, runsAgainst: 48, diff: 34,  streak: 'W2', home: '4-0-1', away: '4-2' },
  { team: "A's",             wins: 8, losses: 2, ties: 1, pct: .773, gb: '-',   runsFor: 86, runsAgainst: 66, diff: 20,  streak: 'W3', home: '2-2-1', away: '6-0' },
  { team: 'Giants',          wins: 7, losses: 3, ties: 0, pct: .700, gb: '1.0', runsFor: 80, runsAgainst: 49, diff: 31,  streak: 'L1', home: '4-1',   away: '3-2' },
  { team: 'White Sox',       wins: 6, losses: 3, ties: 1, pct: .650, gb: '1.5', runsFor: 42, runsAgainst: 44, diff: -2,  streak: 'W1', home: '4-1',   away: '2-2-1' },
  { team: 'Braves',          wins: 5, losses: 3, ties: 2, pct: .600, gb: '2.0', runsFor: 72, runsAgainst: 50, diff: 22,  streak: 'W2', home: '2-2-1', away: '3-1-1' },
  { team: 'Rockies',         wins: 5, losses: 4, ties: 1, pct: .550, gb: '2.5', runsFor: 70, runsAgainst: 79, diff: -9,  streak: 'W3', home: '2-3-1', away: '3-1' },
  { team: 'Harley-WhiteSox', wins: 5, losses: 4, ties: 1, pct: .550, gb: '2.5', runsFor: 82, runsAgainst: 93, diff: -11, streak: 'W4', home: '2-3-1', away: '3-1' },
  { team: 'Cardinals',       wins: 4, losses: 4, ties: 2, pct: .500, gb: '3.0', runsFor: 54, runsAgainst: 53, diff: 1,   streak: 'L1', home: '1-3-1', away: '3-1-1' },
  { team: 'Cubs',            wins: 4, losses: 5, ties: 2, pct: .455, gb: '3.5', runsFor: 67, runsAgainst: 61, diff: 6,   streak: 'L1', home: '3-3',   away: '1-2-2' },
  { team: 'Orioles',         wins: 3, losses: 5, ties: 2, pct: .400, gb: '4.0', runsFor: 50, runsAgainst: 55, diff: -5,  streak: 'L1', home: '1-2-1', away: '2-3-1' },
  { team: 'Pirates',         wins: 4, losses: 6, ties: 0, pct: .400, gb: '4.0', runsFor: 61, runsAgainst: 79, diff: -18, streak: 'L3', home: '2-4',   away: '2-2' },
  { team: 'Astros',          wins: 4, losses: 7, ties: 0, pct: .364, gb: '4.5', runsFor: 47, runsAgainst: 61, diff: -14, streak: 'L1', home: '1-5',   away: '3-2' },
  { team: 'Tigers',          wins: 3, losses: 7, ties: 0, pct: .300, gb: '5.0', runsFor: 72, runsAgainst: 77, diff: -5,  streak: 'L2', home: '2-2',   away: '1-5' },
  { team: 'Reds',            wins: 3, losses: 7, ties: 0, pct: .300, gb: '5.0', runsFor: 46, runsAgainst: 67, diff: -21, streak: 'L1', home: '2-3',   away: '1-4' },
  { team: 'Red Sox',         wins: 2, losses: 8, ties: 0, pct: .200, gb: '6.0', runsFor: 61, runsAgainst: 99, diff: -38, streak: 'L4', home: '1-4',   away: '1-4' },
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
