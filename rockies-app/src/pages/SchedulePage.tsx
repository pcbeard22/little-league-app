import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { INITIAL_GAMES } from '@/data/schedule';
import type { GameData } from '@/lib/player-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FilterTab = 'all' | 'home' | 'away' | 'completed' | 'upcoming';

type MockGame = GameData;

// ---------------------------------------------------------------------------
// Game data from shared schedule
// ---------------------------------------------------------------------------
const MOCK_GAMES: MockGame[] = INITIAL_GAMES;

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'home', label: 'Home' },
  { key: 'away', label: 'Away' },
  { key: 'completed', label: 'Completed' },
  { key: 'upcoming', label: 'Upcoming' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Load Game Changer widget
  useEffect(() => {
    const sdk = document.createElement('script');
    sdk.src = 'https://widgets.gc.com/static/js/sdk.v1.js';
    sdk.onload = () => {
      (window as any).GC?.team?.schedule?.init({
        target: '#gc-schedule-widget-oli0',
        widgetId: 'c5102222-6d07-48e0-bc7d-3b8b621b01a8',
        maxVerticalGamesVisible: 4,
      });
    };
    document.body.appendChild(sdk);
    return () => {
      document.body.removeChild(sdk);
    };
  }, []);

  // Compute record from completed games
  const completed = MOCK_GAMES.filter((g) => g.status === 'completed');
  const wins = completed.filter((g) => g.result === 'W').length;
  const losses = completed.filter((g) => g.result === 'L').length;
  const ties = completed.filter((g) => g.result === 'T').length;

  // Filter games
  const filteredGames = MOCK_GAMES.filter((g) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'home') return g.location === 'home';
    if (activeTab === 'away') return g.location === 'away';
    if (activeTab === 'completed') return g.status === 'completed';
    if (activeTab === 'upcoming') return g.status === 'upcoming';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Season Summary Card */}
      <div className="bg-white rounded-2xl border border-rockies-silver/30 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-rockies-purple to-purple-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Spring 2026 Season</h1>
              <p className="text-white/70 text-sm mt-1">Rockies Little League</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-heading font-bold tracking-tight">
                {wins}-{losses}{ties > 0 ? `-${ties}` : ''}
              </div>
              <p className="text-white/70 text-xs mt-1">
                {completed.length} games played
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-4 py-3 border-t border-rockies-silver/20 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-rockies-purple text-white'
                  : 'bg-rockies-silver/15 text-rockies-black/60 hover:bg-rockies-silver/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — Game Changer Widget (60%) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-rockies-silver/30 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-rockies-silver/20 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rockies-purple" />
              <h2 className="font-heading font-bold text-lg text-rockies-black">
                Game Changer Schedule
              </h2>
            </div>
            <div className="p-4">
              <div
                id="gc-schedule-widget-oli0"
                className="min-h-[400px] rounded-xl overflow-hidden"
              />
            </div>
          </div>
        </div>

        {/* Right column — Quick Game Cards (40%) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h2 className="font-heading font-bold text-lg text-rockies-black">
              Games
            </h2>
            <span className="text-xs text-rockies-black/40 ml-auto">
              {filteredGames.length} games
            </span>
          </div>

          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-xl border border-rockies-silver/30 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-heading font-bold text-rockies-black">
                    vs {game.opponent}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-rockies-black/50">
                      <Calendar className="w-3 h-3" />
                      {game.date}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-rockies-black/50">
                      <Clock className="w-3 h-3" />
                      {game.time}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    game.status === 'completed'
                      ? 'bg-rockies-purple/10 text-rockies-purple'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {game.status === 'completed' ? 'Final' : 'Upcoming'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-rockies-black/50">
                    <MapPin className="w-3 h-3" />
                    {game.location === 'home' ? 'Home' : 'Away'}
                  </span>
                  {game.score && game.result && (
                    <span
                      className={`text-sm font-bold ${
                        game.result === 'W'
                          ? 'text-green-600'
                          : game.result === 'L'
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {game.result}{' '}
                      {game.score.us}-{game.score.them}
                    </span>
                  )}
                </div>

                <Link
                  to="/lineup"
                  className="flex items-center gap-1 text-xs font-semibold text-rockies-purple hover:text-purple-800 transition-colors"
                >
                  {game.status === 'completed' ? 'View Lineup' : 'Edit Lineup'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
