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
import { GripVertical, Save, Share2, Sparkles, FolderOpen, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import BaseballField from '@/components/field/BaseballField';
import InningTabs from '@/components/field/InningTabs';
import GameSelector, { type GameInfo } from '@/components/layout/GameSelector';
import { usePlayers } from '@/context/PlayersContext';
import { POSITIONS, type Position, type Player } from '@/types';
import { suggestLineup } from '@/lib/lineup-engine';
import { saveLineup, loadLineup } from '@/lib/lineup-storage';
import { fetchAIAdjustments } from '@/lib/ai-adjustments';
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
}

function SortablePlayerRow({
  playerId,
  playerIdx,
  orderIdx,
  positions,
  currentInning,
  onPositionChange,
  players,
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
      className={`grid grid-cols-[auto_auto_1fr_repeat(6,36px)] lg:grid-cols-[auto_auto_1fr_repeat(6,48px)] items-center gap-0 border-b border-surface-container-highest ${
        isDragging
          ? 'bg-rockies-purple/5 shadow-lg rounded-lg'
          : orderIdx % 2 === 0
          ? 'bg-white'
          : 'bg-surface/60'
      } hover:bg-surface-container-low transition-colors`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 h-full cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-rockies-black/25" />
      </div>

      {/* Order number */}
      <div className="flex items-center justify-center px-1">
        <span className="w-6 h-6 rounded-full bg-rockies-purple text-white text-[11px] font-bold flex items-center justify-center">
          {orderIdx + 1}
        </span>
      </div>

      {/* Player name + tier + OBP */}
      <div className="flex items-center gap-1.5 px-2 py-2 min-w-0">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${TIER_DOT[p.tier]}`}
          title={p.tier}
        />
        <span className="text-sm font-medium text-rockies-black truncate">
          {p.firstName} {p.lastName}
        </span>
        {obp !== undefined && (
          <span className="hidden lg:inline-flex ml-auto shrink-0 tabular-nums items-center gap-0.5 bg-rockies-purple/8 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-medium text-rockies-purple/50">OBP</span>
            <span className="text-xs font-bold text-rockies-purple">{obp.toFixed(3).replace(/^0/, '')}</span>
          </span>
        )}
      </div>

      {/* 6 inning position dropdowns */}
      {Array.from({ length: TOTAL_INNINGS }, (_, inn) => {
        const pos = positions[inn] ?? 'BN';
        const isActive = inn + 1 === currentInning;
        const isBench = pos === 'BN';
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
  const [gameNotes, setGameNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

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
          setGameNotes(saved.gameNotes ?? '');
          if (saved.gameNotes) setNotesOpen(true);
        } else {
          setBattingOrder(makeDefaultBattingOrder());
          setPositionsByInning(makeDefaultPositions());
          setGameNotes('');
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
        absentPlayers: [],
        gameNotes,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save lineup:', err);
      setSaveStatus('idle');
    }
  }, [currentGameIndex, battingOrder, positionsByInning, gameNotes]);

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

  // Auto-suggest handler — checks previous game's pitchers + AI adjustments
  const handleAutoSuggest = useCallback(async () => {
    setAiLoading(true);

    let lastPitchers: number[] = [];
    const recentNotes: string[] = [];

    // Collect notes and pitcher data from previous games (up to 3)
    const startIdx = Math.max(0, currentGameIndex - 3);
    for (let gi = startIdx; gi < currentGameIndex; gi++) {
      const gid = MOCK_GAMES[gi]?.id;
      if (!gid) continue;
      try {
        const saved = await loadLineup(gid);
        if (saved) {
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
    if (gameNotes.trim()) {
      recentNotes.push(gameNotes);
    }

    // Fetch AI adjustments (returns [] on any error — non-blocking)
    const aiAdjustments = await fetchAIAdjustments(recentNotes, players);

    const suggestion = suggestLineup(players, TOTAL_INNINGS, [], lastPitchers, aiAdjustments);
    setBattingOrder(suggestion.battingOrder);
    setPositionsByInning(suggestion.positionsByInning);
    setAiLoading(false);
  }, [players, currentGameIndex, gameNotes]);

  // Derive field positions for current inning
  const fieldPositions = useMemo(() => {
    return battingOrder
      .map((playerIdx) => {
        const pos = positionsByInning[playerIdx]?.[currentInning - 1] ?? 'BN';
        const p = players[playerIdx];
        return {
          position: pos,
          playerName: `${p.firstName} ${p.lastName}`,
          playerId: p.number,
        };
      })
      .filter((p) => p.position !== 'BN');
  }, [battingOrder, positionsByInning, currentInning]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] pb-24 lg:pb-6">
      {/* Game selector */}
      <GameSelector
        games={MOCK_GAMES}
        currentGameIndex={currentGameIndex}
        onGameChange={handleGameChange}
      />

      {/* Main content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column — baseball field */}
          <div className="w-full lg:w-[45%] lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white rounded-2xl shadow-sm border border-surface-container-highest p-2 sm:p-4">
              {/* Inning tabs above the field */}
              <InningTabs
                currentInning={currentInning}
                onInningChange={setCurrentInning}
                totalInnings={TOTAL_INNINGS}
              />
              <h2 className="font-heading font-semibold text-sm text-rockies-black/60 mt-3 mb-2 text-center">
                Field — {ordinal(currentInning)} Inning
              </h2>
              <BaseballField positions={fieldPositions} />
            </div>
          </div>

          {/* Right column — batting order grid */}
          <div className="w-full lg:w-[55%]">
            <div className="bg-white rounded-2xl shadow-sm border border-surface-container-highest overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[auto_auto_1fr_repeat(6,36px)] lg:grid-cols-[auto_auto_1fr_repeat(6,48px)] items-center gap-0 bg-surface-container-low border-b border-surface-container-highest">
                <div className="w-8" />
                <div className="px-1 py-2">
                  <span className="text-[10px] font-semibold text-rockies-black/40 uppercase">#</span>
                </div>
                <div className="px-2 py-2">
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
                  items={sortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  {battingOrder.map((playerIdx, orderIdx) => (
                    <SortablePlayerRow
                      key={sortableIds[orderIdx]}
                      playerId={sortableIds[orderIdx]}
                      playerIdx={playerIdx}
                      orderIdx={orderIdx}
                      positions={positionsByInning[playerIdx]}
                      currentInning={currentInning}
                      onPositionChange={handlePositionChange}
                      players={players}
                    />
                  ))}
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

      {/* Game Notes */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6">
        <div className="bg-rockies-purple/[0.03] border border-rockies-purple/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setNotesOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-rockies-black/70 hover:bg-rockies-purple/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              Game Notes
              {gameNotes && !notesOpen && (
                <span className="text-xs font-normal text-rockies-purple/50 truncate max-w-[200px]">
                  — {gameNotes.split('\n')[0]}
                </span>
              )}
            </span>
            {notesOpen ? (
              <ChevronUp className="w-4 h-4 text-rockies-black/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-rockies-black/40" />
            )}
          </button>
          {notesOpen && (
            <div className="px-4 pb-4">
              <textarea
                value={gameNotes}
                onChange={(e) => setGameNotes(e.target.value)}
                placeholder="Game notes — strategy, observations, matchup info..."
                className="w-full h-28 rounded-lg border border-rockies-purple/15 bg-white px-3 py-2 text-sm text-rockies-black placeholder:text-rockies-black/30 focus:outline-none focus:ring-2 focus:ring-rockies-purple/30 resize-y"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 lg:relative lg:bottom-auto bg-white/80 backdrop-blur-lg border-t border-surface-container-highest lg:border-t-0 lg:bg-transparent lg:backdrop-blur-none z-30">
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
