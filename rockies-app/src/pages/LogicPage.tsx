import { useState, useEffect, useRef } from 'react';
import {
  Info,
  ShieldCheck,
  Target,
  Armchair,
  Crown,
  Brain,
  Send,
  Loader2,
  Lock,
} from 'lucide-react';
import { saveLogicUpdate, loadLogicUpdates, type LogicUpdate } from '@/lib/logic-storage';

// ---------------------------------------------------------------------------
// PIN protection (same pattern as LineupPage / RosterPage)
// ---------------------------------------------------------------------------

const COACH_PIN = '7625';
const PIN_VERIFIED_KEY = 'rockies_logic_pin_verified';

// ---------------------------------------------------------------------------
// Rule card data
// ---------------------------------------------------------------------------

interface RuleCard {
  text: string;
}

interface RuleSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  rules: RuleCard[];
}

const RULE_SECTIONS: RuleSection[] = [
  {
    title: 'Pitching Rules',
    icon: <Target className="w-5 h-5" />,
    color: 'border-red-200 bg-red-50/50',
    rules: [
      { text: 'Ace pitchers: Rodney #7, Carson #10' },
      { text: 'Strong: Kellen #9' },
      { text: 'Solid: Bennett #8' },
      { text: 'As needed: Riley #11, Leo #3' },
      { text: 'Possible: Hudson #5' },
      { text: 'Pitchers who started last game are deprioritized (not a hard rule)' },
      { text: 'Pitchers must pitch consecutive innings \u2014 no gaps' },
    ],
  },
  {
    title: 'Catcher Rules',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'border-blue-200 bg-blue-50/50',
    rules: [
      { text: 'Bennett catches innings 1-4 (solid default)' },
      { text: 'Kellen catches innings 5-6 (limit usage for all-star)' },
      { text: 'Stephoni available as strategic option' },
    ],
  },
  {
    title: 'Bench Rules',
    icon: <Armchair className="w-5 h-5" />,
    color: 'border-amber-200 bg-amber-50/50',
    rules: [
      { text: 'Stars (Rodney, Kellen, Carson) sit 0-1 innings max' },
      { text: 'Developmental players sit first (up to 3 innings)' },
      { text: '2 players sit each inning (11 players, 9 field spots)' },
    ],
  },
  {
    title: 'Position Priority',
    icon: <Crown className="w-5 h-5" />,
    color: 'border-emerald-200 bg-emerald-50/50',
    rules: [
      { text: 'SS depth: Rodney \u2192 Carson \u2192 Bennett' },
      { text: '1B depth: Kellen \u2192 Carson \u2192 Bennett \u2192 Riley' },
      { text: 'Attributes + depth chart scoring determines remaining positions' },
    ],
  },
  {
    title: 'AI Consideration',
    icon: <Brain className="w-5 h-5" />,
    color: 'border-purple-200 bg-purple-50/50',
    rules: [
      { text: 'Game notes from last 2-3 games are analyzed by Claude Haiku' },
      { text: 'Roster coach notes for all players are included' },
      { text: 'Recent lineup patterns (innings 1-5) are analyzed for trends' },
      { text: 'AI returns position fitness adjustments (-20 to +20) that layer on top of rules' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper: format timestamp
// ---------------------------------------------------------------------------

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LogicPage() {
  // PIN state
  const [pinVerified, setPinVerified] = useState(
    () => sessionStorage.getItem(PIN_VERIFIED_KEY) === 'true',
  );
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Logic updates state
  const [updates, setUpdates] = useState<LogicUpdate[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load updates on mount
  useEffect(() => {
    if (!pinVerified) return;
    setLoading(true);
    loadLogicUpdates()
      .then(setUpdates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pinVerified]);

  // PIN verification
  function verifyPin() {
    if (pinInput === COACH_PIN) {
      setPinVerified(true);
      sessionStorage.setItem(PIN_VERIFIED_KEY, 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  }

  // Post a new update
  async function handlePost() {
    const trimmed = newText.trim();
    if (!trimmed || posting) return;

    setPosting(true);
    try {
      const author = localStorage.getItem('rockies_coach_name') || 'Coach Peyton';
      const saved = await saveLogicUpdate(author, trimmed);
      setUpdates((prev) => [saved, ...prev]);
      setNewText('');
    } catch (err) {
      console.error('Failed to save logic update:', err);
    } finally {
      setPosting(false);
    }
  }

  // -------------------------------------------------------------------------
  // PIN gate
  // -------------------------------------------------------------------------

  if (!pinVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-surface-container-highest p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rockies-purple/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-rockies-purple" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Admin Access Required</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the coach PIN to view engine logic and post updates.</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') verifyPin(); }}
            placeholder="4-digit PIN"
            className={`w-full text-center text-2xl tracking-[0.5em] px-4 py-3 rounded-xl border-2 transition-colors outline-none ${
              pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-rockies-purple'
            }`}
          />
          {pinError && <p className="text-red-500 text-xs mt-2">Incorrect PIN</p>}
          <button
            onClick={verifyPin}
            className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #33006F, #4B0082)' }}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main content
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-rockies-purple" />
            Engine Logic
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            How the auto-suggest engine builds lineups, and how to influence it.
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem(PIN_VERIFIED_KEY);
            setPinVerified(false);
            setPinInput('');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rockies-purple bg-rockies-purple/10 hover:bg-rockies-purple/20 transition-colors"
          title="Lock page"
        >
          <Lock className="w-3.5 h-3.5" />
          Lock
        </button>
      </div>

      {/* ===== Section 1: Current Rules ===== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Current Rules</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {RULE_SECTIONS.map((section) => (
            <div
              key={section.title}
              className={`rounded-xl border p-4 ${section.color}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-600">{section.icon}</span>
                <h3 className="font-semibold text-gray-800 text-sm">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <span>{rule.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Section 2: Logic Updates (chat-like) ===== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Logic Updates</h2>

        {/* Scrollable messages area */}
        <div
          ref={scrollRef}
          className="bg-white rounded-xl border border-surface-container-highest overflow-hidden"
        >
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading updates...
              </div>
            ) : updates.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No logic updates yet. Post one below to influence the AI layer.
              </div>
            ) : (
              updates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-lg p-3 border border-rockies-purple/15 bg-gradient-to-br from-rockies-purple/5 to-purple-50/50"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-semibold text-rockies-purple">
                      {update.author}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatTimestamp(update.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{update.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-surface-container-highest p-3 bg-gray-50/50">
            <div className="flex gap-2">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
                placeholder="e.g. Move Stephoni to catcher more often when Bennett needs rest..."
                rows={2}
                className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-rockies-purple transition-colors"
              />
              <button
                onClick={handlePost}
                disabled={!newText.trim() || posting}
                className="self-end px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #33006F, #4B0082)' }}
              >
                {posting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              Posting as{' '}
              <span className="font-medium text-rockies-purple/70">
                {localStorage.getItem('rockies_coach_name') || 'Coach Peyton'}
              </span>{' '}
              &middot; Press Enter to send
            </p>
          </div>
        </div>
      </section>

      {/* ===== Section 3: How it works info box ===== */}
      <section>
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">How logic updates work</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Logic updates are sent to the AI alongside game notes and coach notes when you use{' '}
                <span className="font-medium text-rockies-purple">Auto-Suggest</span>. The AI
                considers these updates when making position fitness adjustments. Updates don't
                change the hard-coded rules above &mdash; they influence the AI layer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
