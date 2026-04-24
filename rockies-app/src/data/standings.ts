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

// Updated 2026-04-23 from Game Changer screenshot
export const STANDINGS: TeamStanding[] = [
  { team: 'Dodgers',         wins: 9, losses: 2, ties: 1, pct: .792, gb: '-',   runsFor: 90, runsAgainst: 55, diff: 35,  streak: 'W3', home: '5-0-1', away: '4-2' },
  { team: 'Giants',          wins: 9, losses: 3, ties: 0, pct: .750, gb: '0.5', runsFor: 91, runsAgainst: 55, diff: 36,  streak: 'W2', home: '4-1',   away: '5-2' },
  { team: "A's",             wins: 8, losses: 2, ties: 1, pct: .773, gb: '0.5', runsFor: 86, runsAgainst: 66, diff: 20,  streak: 'W3', home: '2-2-1', away: '6-0' },
  { team: 'White Sox',       wins: 7, losses: 4, ties: 1, pct: .625, gb: '2.0', runsFor: 57, runsAgainst: 53, diff: 4,   streak: 'L1', home: '4-1',   away: '3-3-1' },
  { team: 'Braves',          wins: 6, losses: 4, ties: 2, pct: .583, gb: '2.5', runsFor: 86, runsAgainst: 59, diff: 27,  streak: 'W1', home: '2-2-1', away: '4-2-1' },
  { team: 'Harley-WhiteSox', wins: 6, losses: 4, ties: 1, pct: .591, gb: '2.5', runsFor: 99, runsAgainst: 104, diff: -5, streak: 'W5', home: '2-3-1', away: '4-1' },
  { team: 'Rockies',         wins: 5, losses: 5, ties: 1, pct: .500, gb: '3.5', runsFor: 71, runsAgainst: 83, diff: -12, streak: 'L1', home: '2-4-1', away: '3-1' },
  { team: 'Pirates',         wins: 5, losses: 6, ties: 0, pct: .455, gb: '4.0', runsFor: 74, runsAgainst: 90, diff: -16, streak: 'W1', home: '2-4',   away: '3-2' },
  { team: 'Cubs',            wins: 4, losses: 6, ties: 2, pct: .417, gb: '4.5', runsFor: 72, runsAgainst: 68, diff: 4,   streak: 'L2', home: '3-4',   away: '1-2-2' },
  { team: 'Orioles',         wins: 4, losses: 6, ties: 2, pct: .417, gb: '4.5', runsFor: 69, runsAgainst: 75, diff: -6,  streak: 'W1', home: '1-3-1', away: '3-3-1' },
  { team: 'Cardinals',       wins: 4, losses: 6, ties: 2, pct: .417, gb: '4.5', runsFor: 65, runsAgainst: 75, diff: -10, streak: 'L3', home: '1-5-1', away: '3-1-1' },
  { team: 'Astros',          wins: 4, losses: 7, ties: 0, pct: .364, gb: '5.0', runsFor: 47, runsAgainst: 61, diff: -14, streak: 'L1', home: '1-5',   away: '3-2' },
  { team: 'Tigers',          wins: 4, losses: 8, ties: 0, pct: .333, gb: '5.5', runsFor: 90, runsAgainst: 91, diff: -1,  streak: 'L1', home: '2-3',   away: '2-5' },
  { team: 'Reds',            wins: 4, losses: 8, ties: 0, pct: .333, gb: '5.5', runsFor: 55, runsAgainst: 79, diff: -24, streak: 'L1', home: '3-3',   away: '1-5' },
  { team: 'Red Sox',         wins: 3, losses: 9, ties: 0, pct: .250, gb: '6.5', runsFor: 71, runsAgainst: 112, diff: -41, streak: 'W1', home: '2-5',   away: '1-4' },
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
