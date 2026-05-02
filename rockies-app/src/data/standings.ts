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

// Updated 2026-05-02 from Game Changer screenshot
export const STANDINGS: TeamStanding[] = [
  { team: 'Dodgers',    wins: 11, losses: 2,  ties: 1, pct: .821, gb: '-',   runsFor: 104, runsAgainst: 66,  diff: 38,  streak: 'W5', home: '6-0-1', away: '5-2' },
  { team: "A's",        wins: 11, losses: 2,  ties: 1, pct: .821, gb: '-',   runsFor: 109, runsAgainst: 77,  diff: 32,  streak: 'W6', home: '4-2-1', away: '7-0' },
  { team: 'Giants',     wins: 10, losses: 4,  ties: 0, pct: .714, gb: '1.5', runsFor: 104, runsAgainst: 65,  diff: 39,  streak: 'L1', home: '5-2',   away: '5-2' },
  { team: 'Braves',     wins: 8,  losses: 4,  ties: 2, pct: .643, gb: '2.5', runsFor: 109, runsAgainst: 74,  diff: 35,  streak: 'W3', home: '4-2-1', away: '4-2-1' },
  { team: 'White Sox',  wins: 8,  losses: 4,  ties: 1, pct: .654, gb: '2.5', runsFor: 64,  runsAgainst: 54,  diff: 10,  streak: 'W1', home: '5-1',   away: '3-3-1' },
  { team: 'Orioles',    wins: 6,  losses: 6,  ties: 2, pct: .500, gb: '4.5', runsFor: 88,  runsAgainst: 86,  diff: 2,   streak: 'W3', home: '3-3-1', away: '3-3-1' },
  { team: 'Cubs',       wins: 5,  losses: 7,  ties: 2, pct: .429, gb: '5.5', runsFor: 78,  runsAgainst: 76,  diff: 2,   streak: 'L1', home: '3-4',   away: '2-3-2' },
  { team: 'Astros',     wins: 6,  losses: 8,  ties: 0, pct: .429, gb: '5.5', runsFor: 72,  runsAgainst: 76,  diff: -4,  streak: 'W1', home: '2-5',   away: '4-3' },
  { team: 'Cardinals',  wins: 5,  losses: 7,  ties: 2, pct: .429, gb: '5.5', runsFor: 70,  runsAgainst: 84,  diff: -14, streak: 'W1', home: '1-5-1', away: '4-2-1' },
  { team: 'Pirates',    wins: 5,  losses: 8,  ties: 0, pct: .385, gb: '6.0', runsFor: 82,  runsAgainst: 104, diff: -22, streak: 'L2', home: '2-5',   away: '3-3' },
  { team: 'Rockies',    wins: 5,  losses: 8,  ties: 1, pct: .393, gb: '6.0', runsFor: 87,  runsAgainst: 118, diff: -31, streak: 'L4', home: '2-4-1', away: '3-4' },
  { team: 'Tigers',     wins: 4,  losses: 10, ties: 0, pct: .286, gb: '7.5', runsFor: 97,  runsAgainst: 101, diff: -4,  streak: 'L3', home: '2-5',   away: '2-5' },
  { team: 'Reds',       wins: 4,  losses: 10, ties: 0, pct: .286, gb: '7.5', runsFor: 63,  runsAgainst: 93,  diff: -30, streak: 'L3', home: '3-4',   away: '1-6' },
  { team: 'Red Sox',    wins: 3,  losses: 11, ties: 0, pct: .214, gb: '8.5', runsFor: 81,  runsAgainst: 132, diff: -51, streak: 'L2', home: '2-5',   away: '1-6' },
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
