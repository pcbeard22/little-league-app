export interface TeamStanding {
  rank: number;
  team: string;
  coachName: string; // "AAA-CoachName-TeamName" format from Game Changer
  wins: number;
  losses: number;
  ties: number;
  runsFor: number;
  runsAgainst: number;
}

// These will be updated manually — similar to stats CSV updates
export const STANDINGS: TeamStanding[] = [
  { rank: 1, team: 'Rockies', coachName: 'AAA-Covington-Rockies', wins: 1, losses: 2, ties: 1, runsFor: 20, runsAgainst: 25 },
  { rank: 2, team: 'White Sox', coachName: 'AAA-Gates-WhiteSox', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 3, team: 'Braves', coachName: 'AAA-Roberds-Braves', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 4, team: 'Red Sox', coachName: 'AAA-Lee-RedSox', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 5, team: "A's", coachName: "AAA-Miller-A's", wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 6, team: 'Reds', coachName: 'AAA-Minihane-Reds', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 7, team: 'Tigers', coachName: 'AAA-Coyle-Tigers', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 8, team: 'Dodgers', coachName: 'AAA-Milton-Dodgers', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 9, team: 'Pirates', coachName: 'AAA-Redmond-Pirates', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 10, team: 'Cubs', coachName: 'AAA-Rogers-Cubs', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 11, team: 'Cardinals', coachName: 'AAA-Thurman-Cardinals', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 12, team: 'Giants', coachName: 'AAA-Russell-Giants', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
  { rank: 13, team: 'Astros', coachName: 'AAA-DiLuzio-Astros', wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 },
];

// Helper: get sorted standings (by win%, then run differential)
export function getSortedStandings(): TeamStanding[] {
  return [...STANDINGS].sort((a, b) => {
    const aGames = a.wins + a.losses + a.ties;
    const bGames = b.wins + b.losses + b.ties;
    const aWinPct = aGames > 0 ? a.wins / (a.wins + a.losses || 1) : -1;
    const bWinPct = bGames > 0 ? b.wins / (b.wins + b.losses || 1) : -1;
    if (bWinPct !== aWinPct) return bWinPct - aWinPct;
    const aDiff = a.runsFor - a.runsAgainst;
    const bDiff = b.runsFor - b.runsAgainst;
    return bDiff - aDiff;
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
