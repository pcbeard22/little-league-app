export interface Player {
  number: number
  firstName: string
  lastName: string
  tier: 'star' | 'role-player' | 'potential' | 'developmental'
  attributes: PlayerAttributes
  tags: string[]
  positions: {
    primary: string
    secondary: string[]
    wants?: string[]
    avoid?: string[]
  }
  notes: string
  coachPriority: string
  stats?: BattingStats
  pitchingStats?: PitchingStats
  fieldingStats?: FieldingStats
}

export interface PlayerAttributes {
  speed: number        // 1-5
  power: number        // 1-5
  fielding: number     // 1-5
  armStrength: number  // 1-5
  baseballIQ: number   // 1-5
  focus: number        // 1-5
  attitude: number     // 1-5
  contactAbility: number // 1-5
  handEyeCoordination: number // 1-5
}

export interface BattingStats {
  gp: number
  pa: number
  ab: number
  avg: number
  obp: number
  ops: number
  slg: number
  hits: number
  singles: number
  doubles: number
  triples: number
  hr: number
  rbi: number
  runs: number
  bb: number
  so: number
  kl: number
  hbp: number
  sb: number
  cs: number
}

export interface PitchingStats {
  ip: number
  gp: number
  gs: number
  era: number
  whip: number
  hits: number
  runs: number
  er: number
  bb: number
  so: number
  wp: number
  baa: number
}

export interface FieldingStats {
  tc: number
  assists: number
  putouts: number
  fpct: number
  errors: number
  inningsByPosition: Record<string, number>
}

export interface GameLineup {
  id: string
  gameId: string
  gameName: string
  date: string
  opponent: string
  location?: string
  status: 'upcoming' | 'completed' | 'current'
  score?: { us: number; them: number }
  innings: InningLineup[]
  battingOrder: LineupEntry[]
  gameNotes?: string
  savedAt?: Date
  updatedAt?: Date
}

export interface InningLineup {
  inning: number
  positions: PositionAssignment[]
}

export interface PositionAssignment {
  position: string  // P, C, 1B, 2B, 3B, SS, LF, CF, RF, BN
  playerId: number  // player number
  playerName: string
}

export interface LineupEntry {
  order: number
  playerId: number
  playerName: string
  positionsByInning: string[]  // position for each inning
}

export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'BN'

export const POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'BN']

export const POSITION_COLORS: Record<Position, string> = {
  P: '#33006F',
  C: '#18003C',
  '1B': '#4A1A8A',
  '2B': '#5C2D91',
  '3B': '#6B3FA0',
  SS: '#7B52AE',
  LF: '#2D5A27',
  CF: '#3A7233',
  RF: '#478A3F',
  BN: '#C4CED4',
}
