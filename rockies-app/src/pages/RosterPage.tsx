import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Pencil, Check, X, MessageSquarePlus, Lock, Unlock } from 'lucide-react';
import { usePlayers } from '@/context/PlayersContext';
import { fetchCoachNotes, addCoachNote as addCoachNoteToFirebase } from '@/lib/coach-notes';
import type { CoachNote } from '@/lib/coach-notes';
import type { Player, PlayerAttributes } from '@/types';

const COACH_MODE_KEY = 'rockies_coach_mode';
const COACH_PIN = '1234';

/** Tags that are hidden from public (non-coach) view */
const SENSITIVE_TAGS = new Set([
  'worst-attitude', 'complainer', 'family-issues', 'poor-focus', 'low-baseball-iq',
  'attention-deficit', 'weak-catcher', 'error-prone', 'head-flies-out',
  'swing-and-miss', 'watches-strikes', 'late-loader', 'cant-hit-target',
  'hidden-hand-eye', 'game-struggles',
]);

/** Tags removed entirely even in coach mode */
const ALWAYS_HIDDEN_TAGS = new Set(['family-issues']);

/** Display-name overrides for cleaned-up tags (coach mode) */
const TAG_RENAME: Record<string, string> = {
  'worst-attitude': 'attitude-concern',
  'attention-deficit': 'focus-concern',
};

const POSITIVE_TAGS = new Set([
  'speed', 'power', 'smart', 'cerebral', 'good-attitude', 'focused', 'dependable',
  'improving', 'sure-handed', 'all-star', 'most-athletic', 'travel-team', 'fast',
  'strong-arm', 'team-anchor', 'best-player', 'great-infielder', 'switch-hitter',
  'good-hands', 'good-fielder', 'contact-hitter', 'can-play-anywhere',
  'best-catcher', 'smart-baserunner', 'aggressive-swinger', 'good-contact-approach',
  'decent-fielder', 'high-potential',
]);

const NEGATIVE_TAGS = new Set([
  'poor-focus', 'low-baseball-iq', 'attention-deficit', 'error-prone', 'head-flies-out',
  'weak-catcher', 'swing-and-miss', 'watches-strikes', 'worst-attitude', 'complainer',
  'family-issues', 'late-loader', 'long-swing', 'cant-hit-target', 'slow',
  'hidden-hand-eye', 'game-struggles',
]);

const TIER_CONFIG: Record<Player['tier'], { label: string; bg: string; text: string }> = {
  star: { label: 'Star', bg: 'bg-amber-400', text: 'text-amber-900' },
  'role-player': { label: 'Role Player', bg: 'bg-blue-100', text: 'text-blue-800' },
  potential: { label: 'Potential', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  developmental: { label: 'Developmental', bg: 'bg-gray-200', text: 'text-gray-700' },
};

const ATTRIBUTE_LABELS: { key: keyof PlayerAttributes; label: string }[] = [
  { key: 'speed', label: 'Speed' },
  { key: 'power', label: 'Power' },
  { key: 'fielding', label: 'Fielding' },
  { key: 'armStrength', label: 'Arm' },
  { key: 'baseballIQ', label: 'Baseball IQ' },
  { key: 'focus', label: 'Focus' },
  { key: 'attitude', label: 'Attitude' },
  { key: 'contactAbility', label: 'Contact' },
  { key: 'handEyeCoordination', label: 'Hand-Eye' },
];

const POSITION_OPTIONS = ['All', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'OF'] as const;
const TIER_OPTIONS = ['All', 'star', 'role-player', 'potential', 'developmental'] as const;
const SORT_OPTIONS = [
  { value: 'number', label: 'Number' },
  { value: 'name', label: 'Name' },
  { value: 'avg', label: 'AVG' },
  { value: 'ops', label: 'OPS' },
] as const;

const COACH_NAME_KEY = 'rockies_coach_name';

function formatStat(val: number | undefined, digits = 3): string {
  if (val === undefined) return '---';
  if (digits === 3) return val.toFixed(3).replace(/^0/, '');
  return String(val);
}

function getTagColor(tag: string): string {
  if (POSITIVE_TAGS.has(tag)) return 'bg-emerald-100 text-emerald-800';
  if (NEGATIVE_TAGS.has(tag)) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-600';
}

function formatTagLabel(tag: string): string {
  const display = TAG_RENAME[tag] ?? tag;
  return display
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AttributeDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            i <= value ? 'bg-[var(--color-rockies-purple)]' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function CoachNotesSection({ playerNumber }: { playerNumber: number }) {
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [coachName, setCoachName] = useState(() => localStorage.getItem(COACH_NAME_KEY) || '');
  const [editingName, setEditingName] = useState(!localStorage.getItem(COACH_NAME_KEY));
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchCoachNotes(playerNumber)
      .then(setNotes)
      .catch((err) => {
        console.error('Failed to load coach notes:', err);
        setError('Could not load notes');
      })
      .finally(() => setLoading(false));
  }, [playerNumber]);

  const handleSubmit = async () => {
    const name = coachName.trim();
    const text = noteText.trim();
    if (!name || !text) return;

    setSubmitting(true);
    setError('');
    try {
      localStorage.setItem(COACH_NAME_KEY, name);
      const newNote = await addCoachNoteToFirebase(playerNumber, name, text);
      setNotes((prev) => [newNote, ...prev]);
      setNoteText('');
      setEditingName(false);
    } catch (err) {
      console.error('Failed to add note:', err);
      setError('Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-3">
      {/* Divider */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-[10px] uppercase font-semibold text-[var(--color-rockies-purple)] tracking-wide flex items-center gap-1">
          <MessageSquarePlus className="w-3 h-3" />
          Coach Notes
        </span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="text-xs text-gray-400 text-center py-2">Loading notes...</div>
      ) : error && notes.length === 0 ? (
        <div className="text-xs text-red-400 text-center py-2">{error}</div>
      ) : notes.length === 0 ? (
        <div className="text-xs text-gray-400 text-center py-2">No coach notes yet</div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <span className="text-xs font-bold text-[var(--color-rockies-purple)]">
                  {note.coachName}
                </span>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {formatTimestamp(note.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{note.note}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Note form */}
      <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
        {/* Coach name */}
        {editingName ? (
          <input
            type="text"
            value={coachName}
            onChange={(e) => setCoachName(e.target.value)}
            placeholder="Your name (e.g. Coach Peyton)"
            className="w-full text-xs border border-purple-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-rockies-purple)]/40 focus:border-[var(--color-rockies-purple)] bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && coachName.trim()) {
                setEditingName(false);
                localStorage.setItem(COACH_NAME_KEY, coachName.trim());
                textareaRef.current?.focus();
              }
            }}
            autoFocus={!coachName}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">
              Adding as: <span className="font-semibold text-[var(--color-rockies-purple)]">{coachName}</span>
            </span>
            <button
              onClick={() => setEditingName(true)}
              className="text-[10px] text-[var(--color-rockies-purple)] underline hover:text-purple-800 cursor-pointer"
            >
              edit
            </button>
          </div>
        )}

        {/* Note textarea */}
        <textarea
          ref={textareaRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note about this player..."
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-rockies-purple)]/40 focus:border-[var(--color-rockies-purple)] bg-white resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />

        {/* Submit row */}
        <div className="flex items-center justify-between">
          {error && <span className="text-[10px] text-red-500">{error}</span>}
          <div className="flex-1" />
          <button
            onClick={handleSubmit}
            disabled={submitting || !noteText.trim() || !coachName.trim()}
            className="px-3 py-1 text-[11px] font-semibold rounded-md bg-[var(--color-rockies-purple)] text-white hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PinModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (pin === COACH_PIN) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-72 space-y-4">
        <h3 className="text-sm font-bold text-[var(--color-rockies-black)]">Enter Coach PIN</h3>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="PIN"
          className={`w-full text-center text-lg tracking-widest border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-rockies-purple)]/40 ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
        />
        {error && <p className="text-xs text-red-500 text-center">Incorrect PIN</p>}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--color-rockies-purple)] text-white hover:bg-purple-800 cursor-pointer"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

function getVisibleTags(tags: string[], coachMode: boolean): string[] {
  return tags.filter((tag) => {
    // Always hide family-issues
    if (ALWAYS_HIDDEN_TAGS.has(tag)) return false;
    // In public mode, also hide all sensitive tags
    if (!coachMode && SENSITIVE_TAGS.has(tag)) return false;
    return true;
  });
}

function getVisibleAttributes(coachMode: boolean) {
  if (coachMode) return ATTRIBUTE_LABELS;
  return ATTRIBUTE_LABELS.filter(({ key }) => key !== 'attitude');
}

function PlayerCard({
  player,
  onNameChange,
  coachMode,
}: {
  player: Player;
  onNameChange: (number: number, firstName: string, lastName: string) => void;
  coachMode: boolean;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFirst, setEditFirst] = useState(player.firstName);
  const [editLast, setEditLast] = useState(player.lastName);
  const tier = TIER_CONFIG[player.tier];
  const stats = player.stats;

  const handleSaveName = () => {
    const first = editFirst.trim();
    const last = editLast.trim();
    if (first && last) {
      onNameChange(player.number, first, last);
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditFirst(player.firstName);
    setEditLast(player.lastName);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-rockies-purple)] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">
            {player.number}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <input
                  value={editFirst}
                  onChange={(e) => setEditFirst(e.target.value)}
                  className="w-full text-sm font-medium border border-rockies-purple/30 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rockies-purple/40"
                  placeholder="First"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <input
                  value={editLast}
                  onChange={(e) => setEditLast(e.target.value)}
                  className="w-full text-sm font-medium border border-rockies-purple/30 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rockies-purple/40"
                  placeholder="Last"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleSaveName}
                  className="p-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <h3 className="font-bold text-lg text-[var(--color-rockies-black)] leading-tight truncate">
                {player.firstName} {player.lastName}
              </h3>
              <button
                onClick={() => setEditing(true)}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                title="Edit name"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          )}
          <span
            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tier.bg} ${tier.text}`}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {/* Position badges */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        <span className="px-3 py-1 rounded-md text-sm font-bold bg-[var(--color-rockies-purple)] text-white">
          {player.positions.primary}
        </span>
        {player.positions.secondary.map((pos) => (
          <span
            key={pos}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-rockies-silver)] text-[var(--color-rockies-black)]"
          >
            {pos}
          </span>
        ))}
      </div>

      {/* Batting stats row */}
      {stats && (
        <div className="px-5 pb-3">
          <div className="grid grid-cols-4 gap-2">
            {([
              ['AVG', stats.avg, 3],
              ['OBP', stats.obp, 3],
              ['OPS', stats.ops, 3],
              ['RBI', stats.rbi, 0],
            ] as [string, number, number][]).map(([label, val, digits]) => (
              <div
                key={label}
                className="bg-gray-50 rounded-lg px-2 py-1.5 text-center"
              >
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                  {label}
                </div>
                <div className="text-sm font-bold text-[var(--color-rockies-black)]">
                  {digits === 0 ? val : formatStat(val, digits)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribute ratings */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
          {getVisibleAttributes(coachMode).map(({ key, label }) => (
            <div key={key} className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">
                {label}
              </span>
              <AttributeDots value={player.attributes[key]} />
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="px-5 pb-3 flex flex-wrap gap-1">
        {getVisibleTags(player.tags, coachMode).map((tag) => (
          <span
            key={tag}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTagColor(tag)}`}
          >
            {formatTagLabel(tag)}
          </span>
        ))}
      </div>

      {/* Coach notes expandable — only visible in coach mode */}
      {coachMode && (
        <div className="mt-auto border-t border-gray-100">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span>Coach Notes</span>
            {notesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {notesOpen && (
            <div className="px-5 pb-4 space-y-2">
              <p className="text-xs text-gray-600 leading-relaxed">{player.notes}</p>
              <div className="bg-[var(--color-rockies-purple)]/5 border border-[var(--color-rockies-purple)]/10 rounded-lg px-3 py-2">
                <span className="text-[10px] uppercase font-semibold text-[var(--color-rockies-purple)] tracking-wide">
                  Priority
                </span>
                <p className="text-xs text-[var(--color-rockies-black)] mt-0.5 leading-relaxed">
                  {player.coachPriority}
                </p>
              </div>

              {/* Multi-coach notes section */}
              <CoachNotesSection playerNumber={player.number} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RosterPage() {
  const { players, updatePlayerName } = usePlayers();
  const [posFilter, setPosFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'avg' | 'ops'>('number');
  const [coachMode, setCoachMode] = useState(() => localStorage.getItem(COACH_MODE_KEY) === 'true');
  const [showPinModal, setShowPinModal] = useState(false);

  const handleToggleCoachMode = useCallback(() => {
    if (coachMode) {
      // Turning off — no PIN needed
      setCoachMode(false);
      localStorage.removeItem(COACH_MODE_KEY);
    } else {
      // Turning on — require PIN
      setShowPinModal(true);
    }
  }, [coachMode]);

  const handlePinSuccess = useCallback(() => {
    setCoachMode(true);
    localStorage.setItem(COACH_MODE_KEY, 'true');
    setShowPinModal(false);
  }, []);

  const filtered = players
    .filter((p) => {
      if (posFilter !== 'All') {
        const positions = [p.positions.primary, ...p.positions.secondary];
        // Handle "OF" matching LF/CF/RF and vice versa
        const matchesPos = positions.some((pos) => {
          if (posFilter === 'OF') return ['OF', 'LF', 'CF', 'RF'].includes(pos);
          if (['LF', 'CF', 'RF'].includes(posFilter)) return pos === posFilter || pos === 'OF';
          return pos === posFilter;
        });
        if (!matchesPos) return false;
      }
      if (tierFilter !== 'All' && p.tier !== tierFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return a.number - b.number;
        case 'name':
          return a.lastName.localeCompare(b.lastName);
        case 'avg':
          return (b.stats?.avg ?? 0) - (a.stats?.avg ?? 0);
        case 'ops':
          return (b.stats?.ops ?? 0) - (a.stats?.ops ?? 0);
        default:
          return 0;
      }
    });

  const selectClass =
    'px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[var(--color-rockies-black)] font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-rockies-purple)]/40 focus:border-[var(--color-rockies-purple)] cursor-pointer';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* PIN modal */}
      {showPinModal && (
        <PinModal onSuccess={handlePinSuccess} onCancel={() => setShowPinModal(false)} />
      )}

      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-bold text-[var(--color-rockies-black)]">
              Roster
            </h1>
            {coachMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-rockies-purple)] text-white tracking-wide">
                Coach Mode
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {players.length} players &middot; {filtered.length} shown
          </p>
        </div>
        <button
          onClick={handleToggleCoachMode}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          title={coachMode ? 'Lock (exit coach mode)' : 'Unlock coach mode'}
        >
          {coachMode ? (
            <Unlock className="w-4 h-4 text-[var(--color-rockies-purple)]" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
          className={selectClass}
        >
          {POSITION_OPTIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos === 'All' ? 'All Positions' : pos}
            </option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className={selectClass}
        >
          {TIER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Tiers' : TIER_CONFIG[t as Player['tier']].label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Player grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((player) => (
          <PlayerCard key={player.number} player={player} onNameChange={updatePlayerName} coachMode={coachMode} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No players match the selected filters.
        </div>
      )}
    </div>
  );
}
