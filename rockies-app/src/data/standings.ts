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

// Updated 2026-04-28 from Game Changer screenshot
export const STANDINGS: TeamStanding[] = [
  { team: 'Dodgers',         wins: 10, losses: 2, ties: 1, pct: .808, gb: '-',   runsFor: 96,  runsAgainst: 60,  diff: 36,  streak: 'W4', home: '6-0-1', away: '4-2' },
  { team: "A's",             wins: 10, losses: 2, ties: 1, pct: .808, gb: '-',   runsFor: 102, runsAgainst: 73,  diff: 29,  streak: 'W5', home: '3-2-1', away: '7-0' },
  { team: 'Giants',          wins: 10, losses: 3, ties: 0, pct: .769, gb: '0.5', runsFor: 102, runsAgainst: 61,  diff: 41,  streak: 'W3', home: '5-1',   away: '5-2' },
  { team: 'White Sox',       wins: 8,  losses: 4, ties: 1, pct: .654, gb: '2.0', runsFor: 64,  runsAgainst: 54,  diff: 10,  streak: 'W1', home: '5-1',   away: '3-3-1' },
  { team: 'Braves',          wins: 7,  losses: 4, ties: 2, pct: .615, gb: '2.5', runsFor: 97,  runsAgainst: 68,  diff: 29,  streak: 'W2', home: '3-2-1', away: '4-2-1' },
  { team: 'Harley-WhiteSox', wins: 7,  losses: 4, ties: 1, pct: .625, gb: '2.5', runsFor: 107, runsAgainst: 105, diff: 2,   streak: 'W6', home: '2-3-1', away: '5-1' },
  { team: 'Cubs',            wins: 5,  losses: 6, ties: 2, pct: .462, gb: '4.5', runsFor: 74,  runsAgainst: 69,  diff: 5,   streak: 'W1', home: '3-4',   away: '2-2-2' },
  { team: 'Orioles',         wins: 5,  losses: 6, ties: 2, pct: .462, gb: '4.5', runsFor: 78,  runsAgainst: 81,  diff: -3,  streak: 'W2', home: '2-3-1', away: '3-3-1' },
  { team: 'Rockies',         wins: 5,  losses: 7, ties: 1, pct: .423, gb: '5.0', runsFor: 82,  runsAgainst: 108, diff: -26, streak: 'L3', home: '2-4-1', away: '3-3' },
  { team: 'Astros',          wins: 5,  losses: 8, ties: 0, pct: .385, gb: '5.5', runsFor: 67,  runsAgainst: 74,  diff: -7,  streak: 'L1', home: '2-5',   away: '3-3' },
  { team: 'Cardinals',       wins: 4,  losses: 7, ties: 2, pct: .385, gb: '5.5', runsFor: 66,  runsAgainst: 82,  diff: -16, streak: 'L4', home: '1-5-1', away: '3-2-1' },
  { team: 'Pirates',         wins: 5,  losses: 8, ties: 0, pct: .385, gb: '5.5', runsFor: 82,  runsAgainst: 104, diff: -22, streak: 'L2', home: '2-5',   away: '3-3' },
  { team: 'Tigers',          wins: 4,  losses: 9, ties: 0, pct: .308, gb: '6.5', runsFor: 91,  runsAgainst: 93,  diff: -2,  streak: 'L2', home: '2-4',   away: '2-5' },
  { team: 'Reds',            wins: 4,  losses: 9, ties: 0, pct: .308, gb: '6.5', runsFor: 61,  runsAgainst: 88,  diff: -27, streak: 'L2', home: '3-3',   away: '1-6' },
  { team: 'Red Sox',         wins: 3,  losses: 10, ties: 0, pct: .231, gb: '7.5', runsFor: 75, runsAgainst: 120, diff: -45, streak: 'L1', home: '2-5',   away: '1-5' },
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
