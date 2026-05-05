import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Share2, Sparkles, FolderOpen, Loader2, Check, ChevronDown, ChevronUp, Plus, Trash2, Lock } from 'lucide-react';
import BaseballField from '@/components/field/BaseballField';
import InningTabs from '@/components/field/InningTabs';
import GameSelector, { type GameInfo } from '@/components/layout/GameSelector';
import { usePlayers } from '@/context/PlayersContext';
import { POSITIONS, type Position, type Player } from '@/types';
import { suggestLineup } from '@/lib/lineup-engine';
import { saveLineup, loadLineup, deserializeNotes, serializeNotes, type GameNote, type SavedLineup } from '@/lib/lineup-storage';
import { fetchAIAdjustments } from '@/lib/ai-adjustments';
import { fetchCoachNotes } from '@/lib/coach-notes';
import { loadLogicUpdates } from '@/lib/logic-storage';
import SavedLineupsModal from '@/pages/SavedLineupsModal';

// ---------------------------------------------------------------------------
// Games — derived from shared schedule data
// ---------------------------------------------------------------------------
import { INITIAL_GAMES } from '@/data/schedule';

const MOCK_GAMES: GameInfo[] = INITIAL_GAMES.map((g, i) => ({
  id: g.id,
  gameNumber: i + 1,
  opponent: g.opponent,
  date: `${g.date}, 2026`,
}));

const DEFAULT_POSITIONS: Position[] = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'BN', 'BN',
];

const TOTAL_INNINGS = 6;

// Find the first upcoming game (date >= today) to default to
function getNextGameIndex(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < MOCK_GAMES.length; i++) {
    const gameDate = new Date(MOCK_GAMES[i].date);
    if (gameDate >= today) return i;
  }
  return MOCK_GAMES.length - 1; // fallback to last game
}

const TIER_DOT: Record<string, string> = {
  star: 'bg-purple-500',
  'role-player': 'bg-blue-500',
  potential: 'bg-orange-400',
  developmental: 'bg-gray-400',
};

// ---------------------------------------------------------------------------
// Sortable player row
// ---------------------------------------------------------------------------
interface SortableRowProps {
  playerId: string;
  playerIdx: number;
  orderIdx: number;
  positions: string[];
  currentInning: number;
  onPositionChange: (playerIdx: number, inning: number, pos: string) => void;
  players: Player[];
  totalRows: number;
  onMoveUp: (orderIdx: number) => void;
  onMoveDown: (orderIdx: number) => void;
  isAbsent: boolean;
  onToggleAbsent: (playerIdx: number) => void;
}

function SortablePlayerRow({
  playerId,
  playerIdx,
  orderIdx,
  positions,
  currentInning,
  onPositionChange,
  players,
  totalRows,
  onMoveUp,
  onMoveDown,
  isAbsent,
  onToggleAbsent,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: playerId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' as const : undefined,
  };

  const p = players[playerIdx];
  const obp = p.stats?.obp;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[auto_auto_auto_1fr_repeat(6,36px)] sm:grid-cols-[auto_auto_auto_1fr_repeat(6,40px)] lg:grid-cols-[auto_auto_auto_1fr_repeat(6,48px)] items-center gap-0 border-b border-surface-container-highest ${
        isDragging
          ? 'bg-rockies-purple/5 shadow-lg rounded-lg'
          : orderIdx % 2 === 0
          ? 'bg-white'
          : 'bg-surface/60'
      } hover:bg-surface-container-low transition-colors`}
    >
      {/* Drag handle — desktop only */}
      <div
        {...attributes}
        {...listeners}
        className="hidden lg:flex items-center justify-center w-8 h-full cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-rockies-black/25" />
      </div>

      {/* Up/Down arrows — mobile only */}
      <div className="flex lg:hidden flex-col items-center justify-center w-6 h-full gap-0">
        {orderIdx > 0 ? (
          <button
            type="button"
            onClick={() => onMoveUp(orderIdx)}
            className="p-0.5 text-rockies-black/30 hover:text-rockies-black/60 active:text-rockies-purple transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-4 h-4 p-0.5" />
        )}
        {orderIdx < totalRows - 1 ? (
          <button
            type="button"
            onClick={() => onMoveDown(orderIdx)}
            className="p-0.5 text-rockies-black/30 hover:text-rockies-black/60 active:text-rockies-purple transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-4 h-4 p-0.5" />
        )}
      </div>

      {/* Order number */}
      <div className="flex items-center justify-center px-1">
        <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
          isAbsent ? 'bg-red-500 text-white' : 'bg-rockies-purple text-white'
        }`}>
          {isAbsent ? '✕' : orderIdx + 1}
        </span>
      </div>

      {/* OUT toggle */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleAbsent(playerIdx); }}
          className={`shrink-0 rounded flex items-center justify-center transition-colors w-5 h-5 lg:w-auto lg:h-auto lg:px-1.5 lg:py-0.5 ${
            isAbsent
              ? 'bg-red-100 text-red-500 border border-red-300 hover:bg-red-200'
              : 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          }`}
          title={isAbsent ? 'Add back' : 'Mark as out'}
        >
          <span className="lg:hidden text-[8px] font-bold">{isAbsent ? '—' : '✕'}</span>
          <span className="hidden lg:inline text-[9px] font-bold uppercase">{isAbsent ? 'Back' : 'Out'}</span>
        </button>
      </div>

      {/* Player name + tier + OBP */}
      <div className={`flex items-center gap-1.5 pl-2 pr-0.5 lg:pr-2 py-2 min-w-0 ${isAbsent ? 'opacity-40' : ''}`}>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${TIER_DOT[p.tier]}`}
          title={p.tier}
        />
        <span className={`text-sm font-medium truncate ${isAbsent ? 'line-through text-rockies-black/50' : 'text-rockies-black'}`}>
          <span className="sm:hidden">{p.firstName}</span>
          <span className="hidden sm:inline">{p.firstName} {p.lastName}</span>
        </span>
        {!isAbsent && obp !== undefined && (
          <span className="hidden lg:inline-flex ml-auto shrink-0 tabular-nums items-center gap-0.5 bg-rockies-purple/8 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-medium text-rockies-purple/50">OBP</span>
            <span className="text-xs font-bold text-rockies-purple">{obp.toFixed(3).replace(/^0/, '')}</span>
          </span>
        )}
        {!isAbsent && obp === undefined && <span />}
      </div>

      {/* 6 inning position dropdowns */}
      {Array.from({ length: TOTAL_INNINGS }, (_, inn) => {
        const pos = isAbsent ? 'OUT' : (positions[inn] ?? 'BN');
        const isActive = inn + 1 === currentInning;
        const isBench = pos === 'BN';
        const isOut = pos === 'OUT';
        if (isOut) {
          return (
            <div key={inn} className="flex items-center justify-center px-0.5 py-1.5">
              <span className="w-full text-[8px] sm:text-[10px] font-semibold rounded-md border border-red-300 bg-red-100 text-red-400 py-1 text-center overflow-hidden">
                —
              </span>
            </div>
          );
        }
        return (
          <div key={inn} className="flex items-center justify-center px-0.5 py-1.5">
            <select
              value={pos}
              onChange={(e) => onPositionChange(playerIdx, inn, e.target.value)}
              className={`w-full text-[11px] font-semibold rounded-md border px-0.5 py-1 text-center cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-rockies-purple/40 transition-colors ${
                isBench
                  ? 'border-red-300 bg-red-100 text-red-600'
                  : isActive
                  ? 'border-rockies-purple bg-rockies-purple/10 text-rockies-purple'
                  : 'border-surface-container-highest bg-surface-container-low text-rockies-black/70'
              }`}
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        );
      })}

    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LineupPage() {
  const { players } = usePlayers();
  const [currentGameIndex, setCurrentGameIndex] = useState(getNextGameIndex);
  const [currentInning, setCurrentInning] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loadingGame, setLoadingGame] = useState(false);
  const [showLineupsModal, setShowLineupsModal] = useState(false);
  const [gameNoteEntries, setGameNoteEntries] = useState<GameNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [absentPlayers, setAbsentPlayers] = useState<Set<number>>(new Set());
  const [fieldOpen, setFieldOpen] = useState(false);
  const [notesUnlocked, setNotesUnlocked] = useState(() => localStorage.getItem('rockies_coach_mode') === 'true');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Default lineup generators (stable — no dependency on players ref)
  function makeDefaultBattingOrder() {
    return players.map((_p, i) => i);
  }
  function makeDefaultPositions() {
    return players.map((_, playerIdx) => {
      const pos = DEFAULT_POSITIONS[playerIdx] ?? 'BN';
      return Array.from({ length: TOTAL_INNINGS }, () => pos);
    });
  }

  // battingOrder: indices into `players`, kept in order
  const [battingOrder, setBattingOrder] = useState<number[]>(() => makeDefaultBattingOrder());

  // positionsByInning[playerIdx][inning] = position string
  const [positionsByInning, setPositionsByInning] = useState<string[][]>(() => makeDefaultPositions());

  // Track which game is loaded to avoid re-fetching
  const [loadedGameId, setLoadedGameId] = useState<string | null>(null);

  // Load saved lineup when game changes
  useEffect(() => {
    const game = MOCK_GAMES[currentGameIndex];
    if (!game || game.id === loadedGameId) return;

    let cancelled = false;
    setLoadingGame(true);

    loadLineup(game.id)
      .then((saved) => {
        if (cancelled) return;
        if (saved) {
          setBattingOrder(saved.battingOrder);
          setPositionsByInning(saved.positionsByInning);
          setAbsentPlayers(new Set());
          const entries = deserializeNotes(saved.gameNotes ?? '');
          setGameNoteEntries(entries);
          if (entries.length > 0) setNotesOpen(true);
        } else {
          setBattingOrder(makeDefaultBattingOrder());
          setPositionsByInning(makeDefaultPositions());
          setAbsentPlayers(new Set());
          setGameNoteEntries([]);
        }
        setLoadedGameId(game.id);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load lineup:', err);
        // Only reset to defaults if we haven't loaded anything yet
        if (!loadedGameId) {
          setBattingOrder(makeDefaultBattingOrder());
          setPositionsByInning(makeDefaultPositions());
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGame(false);
      });

    return () => { cancelled = true; };
  }, [currentGameIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle game change from selector
  const handleGameChange = useCallback(
    (index: number) => {
      setLoadedGameId(null); // force reload
      setCurrentGameIndex(index);
    },
    [],
  );

  // Handle game change from modal (find game by ID)
  const handleLoadFromModal = useCallback(
    (gameId: string) => {
      const idx = MOCK_GAMES.findIndex((g) => g.id === gameId);
      if (idx !== -1) {
        setLoadedGameId(null); // force reload
        setCurrentGameIndex(idx);
      }
    },
    [],
  );

  // Handle save
  const handleSave = useCallback(async () => {
    const game = MOCK_GAMES[currentGameIndex];
    if (!game) return;
    setSaveStatus('saving');
    try {
      await saveLineup({
        id: game.id,
        gameName: `Game ${game.gameNumber} vs ${game.opponent}`,
        gameDate: game.date,
        battingOrder,
        positionsByInning,
        absentPlayers: Array.from(absentPlayers),
        gameNotes: serializeNotes(gameNoteEntries),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save lineup:', err);
      setSaveStatus('idle');
    }
  }, [currentGameIndex, battingOrder, positionsByInning, gameNoteEntries]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Stable IDs for sortable context (player number as string)
  const sortableIds = useMemo(
    () => battingOrder.map((idx) => `player-${players[idx].number}`),
    [battingOrder],
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortableIds.indexOf(active.id as string);
      const newIndex = sortableIds.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      setBattingOrder((prev) => arrayMove(prev, oldIndex, newIndex));
    },
    [sortableIds],
  );

  // Handle position change for any inning
  const handlePositionChange = useCallback(
    (playerIdx: number, inning: number, newPos: string) => {
      setPositionsByInning((prev) => {
        const next = prev.map((arr) => [...arr]);
        next[playerIdx] = [...next[playerIdx]];
        next[playerIdx][inning] = newPos;
        return next;
      });
    },
    [],
  );

  // Move player up/down in batting order (mobile arrows)
  // Toggle absent
  const handleToggleAbsent = useCallback((playerIdx: number) => {
    const playerNum = players[playerIdx].number;
    setAbsentPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerNum)) {
        next.delete(playerNum);
      } else {
        next.add(playerNum);
      }
      return next;
    });
  }, [players]);

  // Sort batting order for display: active players first, absent at bottom
  const displayOrder = useMemo(() => {
    const active: number[] = [];
    const absent: number[] = [];
    for (const idx of battingOrder) {
      if (absentPlayers.has(players[idx].number)) {
        absent.push(idx);
      } else {
        active.push(idx);
      }
    }
    return [...active, ...absent];
  }, [battingOrder, absentPlayers, players]);

  const handleMoveUp = useCallback((orderIdx: number) => {
    if (orderIdx <= 0 || orderIdx >= displayOrder.length) return;
    const playerA = displayOrder[orderIdx];
    const playerB = displayOrder[orderIdx - 1];
    setBattingOrder((prev) => {
      const next = [...prev];
      const aIdx = next.indexOf(playerA);
      const bIdx = next.indexOf(playerB);
      if (aIdx === -1 || bIdx === -1) return prev;
      [next[aIdx], next[bIdx]] = [next[bIdx], next[aIdx]];
      return next;
    });
  }, [displayOrder]);

  const handleMoveDown = useCallback((orderIdx: number) => {
    if (orderIdx < 0 || orderIdx >= displayOrder.length - 1) return;
    const playerA = displayOrder[orderIdx];
    const playerB = displayOrder[orderIdx + 1];
    setBattingOrder((prev) => {
      const next = [...prev];
      const aIdx = next.indexOf(playerA);
      const bIdx = next.indexOf(playerB);
      if (aIdx === -1 || bIdx === -1) return prev;
      [next[aIdx], next[bIdx]] = [next[bIdx], next[aIdx]];
      return next;
    });
  }, [displayOrder]);

  // Auto-suggest handler — checks previous game's pitchers + AI adjustments
  const handleAutoSuggest = useCallback(async () => {
    setAiLoading(true);

    let lastPitchers: number[] = [];
    const recentNotes: string[] = [];
    const recentSaved: { gameIndex: number; saved: SavedLineup }[] = [];

    // Collect notes, pitcher data, and saved lineups from previous games (up to 3)
    const startIdx = Math.max(0, currentGameIndex - 3);
    for (let gi = startIdx; gi < currentGameIndex; gi++) {
      const gid = MOCK_GAMES[gi]?.id;
      if (!gid) continue;
      try {
        const saved = await loadLineup(gid);
        if (saved) {
          recentSaved.push({ gameIndex: gi, saved });

          // Collect game notes
          if (saved.gameNotes?.trim()) {
            recentNotes.push(saved.gameNotes);
          }
          // Find pitchers from the immediately previous game
          if (gi === currentGameIndex - 1) {
            const pitcherIndices = new Set<number>();
            for (let pIdx = 0; pIdx < saved.positionsByInning.length; pIdx++) {
              for (const pos of saved.positionsByInning[pIdx]) {
                if (pos === 'P') pitcherIndices.add(pIdx);
              }
            }
            lastPitchers = Array.from(pitcherIndices)
              .map((idx) => players[idx]?.number)
              .filter(Boolean);
          }
        }
      } catch {
        // Silently continue without this game's data
      }
    }

    // Include current game notes if any
    const currentNotesText = gameNoteEntries.map(n => `[${n.author}]: ${n.text}`).join('\n\n');
    if (currentNotesText.trim()) {
      recentNotes.push(currentNotesText);
    }

    // Load roster coach notes for all players
    const rosterNotes: string[] = [];
    try {
      for (const p of players) {
        const notes = await fetchCoachNotes(p.number);
        if (notes.length > 0) {
          const playerNotes = notes.map(n => `[${n.coachName} on ${p.firstName} ${p.lastName}]: ${n.note}`).join('\n');
          rosterNotes.push(playerNotes);
        }
      }
    } catch {
      // Silently continue without roster notes
    }

    // Extract position patterns from recent games (innings 1-5 only, skip inning 6)
    let lineupPatterns = '';
    if (recentSaved.length > 0) {
      const patternLines: string[] = [];
      for (const { gameIndex, saved } of recentSaved) {
        const game = MOCK_GAMES[gameIndex];
        if (!game) continue;

        const playerPatterns: string[] = [];
        for (const boIdx of saved.battingOrder) {
          const p = players[boIdx];
          if (!p) continue;

          // Collect positions for innings 1-5 only (indices 0-4)
          const inningPositions = saved.positionsByInning[boIdx]?.slice(0, 5) ?? [];
          if (inningPositions.length === 0) continue;

          // Compress consecutive same positions: e.g. SS(1-3), 2B(4-5)
          const runs: { pos: string; start: number; end: number }[] = [];
          for (let inn = 0; inn < inningPositions.length; inn++) {
            const pos = inningPositions[inn] ?? 'BN';
            if (runs.length > 0 && runs[runs.length - 1].pos === pos) {
              runs[runs.length - 1].end = inn + 1;
            } else {
              runs.push({ pos, start: inn + 1, end: inn + 1 });
            }
          }

          const runStr = runs
            .map(r => r.start === r.end ? `${r.pos}(${r.start})` : `${r.pos}(${r.start}-${r.end})`)
            .join('/');

          playerPatterns.push(`${p.firstName}→${runStr}`);
        }

        patternLines.push(
          `Game ${game.gameNumber} vs ${game.opponent}: ${playerPatterns.join(', ')}`
        );
      }

      if (patternLines.length > 0) {
        lineupPatterns = `Recent lineup patterns (last ${patternLines.length} game${patternLines.length > 1 ? 's' : ''}, innings 1-5 only):\n${patternLines.join('\n')}`;
      }
    }

    // Load logic updates from Firebase
    let logicUpdateTexts: string[] = [];
    try {
      const logicUpdates = await loadLogicUpdates();
      logicUpdateTexts = logicUpdates.map((u) => `[${u.author}]: ${u.text}`);
    } catch {
      // Silently continue without logic updates
    }

    // Fetch AI adjustments (returns [] on any error — non-blocking)
    const aiAdjustments = await fetchAIAdjustments(recentNotes, players, rosterNotes, lineupPatterns, logicUpdateTexts);

    const absentArr = Array.from(absentPlayers);
    const suggestion = suggestLineup(players, TOTAL_INNINGS, absentArr, lastPitchers, aiAdjustments);

    // The engine filters out absent players and returns indices into the filtered array.
    // We need to map those back to indices in the full `players` array.
    const absentSet = new Set(absentArr);
    const filteredToFull: number[] = [];
    for (let i = 0; i < players.length; i++) {
      if (!absentSet.has(players[i].number)) {
        filteredToFull.push(i);
      }
    }

    // Map batting order: filtered indices → full indices
    const mappedBattingOrder = suggestion.battingOrder.map((fi) => filteredToFull[fi]);
    // Add absent players at the end
    const absentIndices = players
      .map((p, i) => (absentSet.has(p.number) ? i : -1))
      .filter((i) => i !== -1);
    const fullBattingOrder = [...mappedBattingOrder, ...absentIndices];

    // Map positions: create full-size array, fill absent with 'OUT' for all innings
    const fullPositions: string[][] = players.map(() => Array(TOTAL_INNINGS).fill('BN'));
    for (let fi = 0; fi < suggestion.positionsByInning.length; fi++) {
      const fullIdx = filteredToFull[fi];
      fullPositions[fullIdx] = suggestion.positionsByInning[fi];
    }
    for (const ai of absentIndices) {
      fullPositions[ai] = Array(TOTAL_INNINGS).fill('OUT');
    }

    setBattingOrder(fullBattingOrder);
    setPositionsByInning(fullPositions);
    setAiLoading(false);
  }, [players, currentGameIndex, gameNoteEntries]);

  const displaySortableIds = useMemo(
    () => displayOrder.map((idx) => `player-${players[idx].number}`),
    [displayOrder, players],
  );

  // Derive field positions for current inning
  const fieldPositions = useMemo(() => {
    return battingOrder
      .map((playerIdx) => {
        const p = players[playerIdx];
        if (absentPlayers.has(p.number)) return null;
        const pos = positionsByInning[playerIdx]?.[currentInning - 1] ?? 'BN';
        return {
          position: pos,
          playerName: `${p.firstName} ${p.lastName}`,
          playerId: p.number,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null && p.position !== 'BN');
  }, [battingOrder, positionsByInning, currentInning, absentPlayers]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] pb-32 lg:pb-6">
      {/* Game selector */}
      <GameSelector
        games={MOCK_GAMES}
        currentGameIndex={currentGameIndex}
        onGameChange={handleGameChange}
      />

      {/* Main content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 py-4 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column — baseball field (collapsible on mobile) */}
          <div className="w-full lg:w-[45%] lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white rounded-2xl shadow-sm border border-surface-container-highest p-1 lg:p-4">
              {/* Inning tabs — always visible */}
              <InningTabs
                currentInning={currentInning}
                onInningChange={setCurrentInning}
                totalInnings={TOTAL_INNINGS}
              />

              {/* Collapsible header — mobile only */}
              <button
                onClick={() => setFieldOpen((o) => !o)}
                className="lg:hidden w-full flex items-center justify-center gap-2 mt-2 mb-1 py-2.5 px-4 rounded-lg bg-rockies-purple/10 border border-rockies-purple/30 transition-colors active:bg-rockies-purple/20"
              >
                <h2 className="font-heading font-semibold text-sm text-rockies-purple">
                  {fieldOpen ? 'Tap to Hide Field' : 'Tap to Show Field'}
                </h2>
                {fieldOpen ? (
                  <ChevronUp className="w-4 h-4 text-rockies-purple" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-rockies-purple" />
                )}
              </button>

              {/* Desktop header — always shown */}
              <h2 className="hidden lg:block font-heading font-semibold text-sm text-rockies-black/60 mt-3 mb-2 text-center">
                Field — {ordinal(currentInning)} Inning
              </h2>

              {/* Field SVG — always shown on desktop, toggle on mobile */}
              <div className={`${fieldOpen ? 'block' : 'hidden'} lg:block w-full`}>
                <BaseballField positions={fieldPositions} />
              </div>
            </div>
          </div>

          {/* Right column — batting order grid */}
          <div className="w-full lg:w-[55%]">
            <div className="bg-white rounded-2xl shadow-sm border border-surface-container-highest overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[auto_auto_auto_1fr_repeat(6,36px)] sm:grid-cols-[auto_auto_auto_1fr_repeat(6,40px)] lg:grid-cols-[auto_auto_auto_1fr_repeat(6,48px)] items-center gap-0 bg-surface-container-low border-b border-surface-container-highest">
                <div className="w-8" />
                <div className="px-1 py-2">
                  <span className="text-[10px] font-semibold text-rockies-black/40 uppercase">#</span>
                </div>
                <div className="w-5 lg:w-8" />
                <div className="pl-2 pr-0.5 lg:pr-2 py-2">
                  <span className="text-[10px] font-semibold text-rockies-black/40 uppercase">Player</span>
                </div>
                {Array.from({ length: TOTAL_INNINGS }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentInning(i + 1)}
                    className={`text-[10px] font-bold text-center py-2 transition-colors ${
                      i + 1 === currentInning
                        ? 'text-rockies-purple'
                        : 'text-rockies-black/40 hover:text-rockies-black/60'
                    }`}
                  >
                    {ordinal(i + 1)}
                  </button>
                ))}
              </div>

              {/* Sortable player rows */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displaySortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  {displayOrder.map((playerIdx, orderIdx) => {
                    const isOut = absentPlayers.has(players[playerIdx].number);
                    const activeCount = displayOrder.filter((i) => !absentPlayers.has(players[i].number)).length;
                    return (
                      <SortablePlayerRow
                        key={`player-${players[playerIdx].number}`}
                        playerId={`player-${players[playerIdx].number}`}
                        playerIdx={playerIdx}
                        orderIdx={orderIdx}
                        positions={positionsByInning[playerIdx]}
                        currentInning={currentInning}
                        onPositionChange={handlePositionChange}
                        players={players}
                        totalRows={activeCount}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        isAbsent={isOut}
                        onToggleAbsent={handleToggleAbsent}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay when switching games */}
      {loadingGame && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-rockies-purple">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading lineup...</span>
          </div>
        </div>
      )}

      {/* Game Notes — PIN protected */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6">
        <div className="bg-rockies-purple/[0.03] border border-rockies-purple/10 rounded-xl overflow-hidden">
          <button
            onClick={() => {
              if (!notesUnlocked) {
                setShowPinPrompt(true);
                return;
              }
              setNotesOpen((o) => !o);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-rockies-black/70 hover:bg-rockies-purple/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              {notesUnlocked ? (
                <>
                  Game Notes{gameNoteEntries.length > 0 && ` (${gameNoteEntries.length})`}
                  {gameNoteEntries.length > 0 && !notesOpen && (
                    <span className="text-xs font-normal text-rockies-purple/50 truncate max-w-[200px]">
                      — {gameNoteEntries[gameNoteEntries.length - 1].text.split('\n')[0]}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rockies-black/40" />
                  Game Notes (Locked)
                </>
              )}
            </span>
            {notesUnlocked ? (
              notesOpen ? <ChevronUp className="w-4 h-4 text-rockies-black/40" /> : <ChevronDown className="w-4 h-4 text-rockies-black/40" />
            ) : (
              <span className="text-[10px] text-rockies-black/40">PIN required</span>
            )}
          </button>

          {/* PIN prompt modal */}
          {showPinPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowPinPrompt(false); setPinInput(''); setPinError(false); }} />
              <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs mx-4">
                <h3 className="text-sm font-bold text-rockies-black mb-3">Enter Coach PIN</h3>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (pinInput === '7625') {
                        setNotesUnlocked(true);
                        setNotesOpen(true);
                        setShowPinPrompt(false);
                        setPinInput('');
                        localStorage.setItem('rockies_coach_mode', 'true');
                      } else {
                        setPinError(true);
                      }
                    }
                  }}
                  placeholder="PIN"
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-rockies-purple/40"
                />
                {pinError && <p className="text-xs text-red-500 mt-1 text-center">Incorrect PIN</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setShowPinPrompt(false); setPinInput(''); setPinError(false); }} className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={() => {
                    if (pinInput === '7625') {
                      setNotesUnlocked(true);
                      setNotesOpen(true);
                      setShowPinPrompt(false);
                      setPinInput('');
                      localStorage.setItem('rockies_coach_mode', 'true');
                    } else {
                      setPinError(true);
                    }
                  }} className="flex-1 px-3 py-2 text-xs font-bold rounded-lg bg-rockies-purple text-white hover:bg-rockies-deep-purple transition-colors">Unlock</button>
                </div>
              </div>
            </div>
          )}
          {notesOpen && notesUnlocked && (
            <div className="px-4 pb-4 space-y-3">
              {/* Existing note entries */}
              {gameNoteEntries.length > 0 && (
                <div className="space-y-2">
                  {gameNoteEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg border border-rockies-purple/10 px-3 py-2.5 group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-rockies-purple">{entry.author}</span>
                          <span className="text-xs text-rockies-black/40">
                            {formatNoteDate(entry.date)}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setGameNoteEntries((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-rockies-black/30 hover:text-red-500 transition-all"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-rockies-black/80 whitespace-pre-wrap">{entry.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new note */}
              <div className="space-y-2">
                <p className="text-xs text-rockies-black/40">
                  Adding as:{' '}
                  <span className="font-semibold text-rockies-purple/70">
                    {localStorage.getItem('rockies_coach_name') || 'Coach Peyton'}
                  </span>
                </p>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add a note — strategy, observations, matchup info..."
                  className="w-full h-20 rounded-lg border border-rockies-purple/15 bg-white px-3 py-2 text-sm text-rockies-black placeholder:text-rockies-black/30 focus:outline-none focus:ring-2 focus:ring-rockies-purple/30 resize-y"
                />
                <button
                  onClick={() => {
                    if (!newNoteText.trim()) return;
                    const coachName = localStorage.getItem('rockies_coach_name') || 'Coach Peyton';
                    const today = new Date().toISOString().split('T')[0];
                    setGameNoteEntries((prev) => [
                      ...prev,
                      { author: coachName, date: today, text: newNoteText.trim() },
                    ]);
                    setNewNoteText('');
                  }}
                  disabled={!newNoteText.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rockies-purple hover:bg-rockies-deep-purple transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 lg:relative lg:bottom-auto bg-white/80 backdrop-blur-lg border-t border-surface-container-highest lg:border-t-0 lg:bg-transparent lg:backdrop-blur-none z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={handleAutoSuggest}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rockies-purple border border-rockies-purple/20 bg-rockies-purple/5 hover:bg-rockies-purple/10 transition-colors disabled:opacity-60"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{aiLoading ? 'Analyzing...' : 'Auto-Suggest'}</span>
          </button>
          <button
            onClick={() => setShowLineupsModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rockies-black/70 border border-surface-container-highest bg-white hover:bg-surface-container-low transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">My Lineups</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rockies-black/70 border border-surface-container-highest bg-white hover:bg-surface-container-low transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`inline-flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all ${
              saveStatus === 'saved'
                ? 'bg-green-600 shadow-green-600/25'
                : 'bg-gradient-to-r from-rockies-purple to-rockies-deep-purple shadow-rockies-purple/25 hover:shadow-lg hover:shadow-rockies-purple/30 hover:brightness-110'
            } disabled:opacity-70`}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Saved lineups modal */}
      <SavedLineupsModal
        open={showLineupsModal}
        onClose={() => setShowLineupsModal(false)}
        onLoadLineup={handleLoadFromModal}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function formatNoteDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoDate;
  }
}
