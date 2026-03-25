import { useEffect } from 'react';
import { Calendar, Trophy } from 'lucide-react';
import { getSortedStandings, getTeamRecord, formatRecord } from '@/data/standings';

export default function SchedulePage() {
  // Load Game Changer widget
  useEffect(() => {
    const sdk = document.createElement('script');
    sdk.src = 'https://widgets.gc.com/static/js/sdk.v1.js';
    sdk.onload = () => {
      (window as any).GC?.team?.schedule?.init({
        target: '#gc-schedule-widget-oli0',
        widgetId: 'c5102222-6d07-48e0-bc7d-3b8b621b01a8',
        maxVerticalGamesVisible: 6,
      });
    };
    document.body.appendChild(sdk);
    return () => {
      document.body.removeChild(sdk);
    };
  }, []);

  const sortedStandings = getSortedStandings();
  const rockies = getTeamRecord('Rockies');
  const record = rockies ? formatRecord(rockies) : '0-0';
  const gamesPlayed = rockies ? rockies.wins + rockies.losses + rockies.ties : 0;

  return (
    <div className="space-y-6">
      {/* Season Summary Card */}
      <div className="bg-white rounded-2xl border border-rockies-silver/30 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-rockies-purple to-purple-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">Spring 2026 Season</h1>
              <p className="text-white/70 text-sm mt-1">Rockies Little League — AAA Division</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-heading font-bold tracking-tight">
                {record}
              </div>
              <p className="text-white/70 text-xs mt-1">
                {gamesPlayed} games played
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Standings (left), Schedule widget (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — Standings */}
        <div className="lg:col-span-3">
          <div id="standings" className="bg-white rounded-2xl border border-rockies-silver/30 shadow-sm overflow-hidden scroll-mt-4">
            <div className="px-5 py-3 border-b border-rockies-silver/20 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-rockies-purple" />
              <h2 className="font-heading font-bold text-lg text-rockies-black">
                AAA Standings
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-rockies-silver/20 bg-gray-50/80">
                    <th className="text-left px-2 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider w-8">#</th>
                    <th className="text-left px-2 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">Team</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">W</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">L</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">T</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">PCT</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">GB</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">RS</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">RA</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">DIFF</th>
                    <th className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider">STRK</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStandings.map((team, idx) => {
                    const isRockies = team.team === 'Rockies';
                    return (
                      <tr
                        key={team.team}
                        className={`border-b border-rockies-silver/10 transition-colors ${
                          isRockies
                            ? 'bg-rockies-purple/10 font-semibold'
                            : idx % 2 === 0
                              ? 'bg-white'
                              : 'bg-gray-50/40'
                        } ${!isRockies ? 'hover:bg-gray-50/80' : ''}`}
                      >
                        <td className={`px-2 py-2 ${isRockies ? 'text-rockies-purple font-bold' : 'text-rockies-black/40'}`}>
                          {idx + 1}
                        </td>
                        <td className={`px-2 py-2 whitespace-nowrap ${isRockies ? 'text-rockies-purple' : 'text-rockies-black'}`}>
                          <div className="flex items-center gap-1.5">
                            {isRockies && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rockies-purple shrink-0" />
                            )}
                            {team.team}
                          </div>
                        </td>
                        <td className="text-center px-1.5 py-2 text-rockies-black/80">{team.wins}</td>
                        <td className="text-center px-1.5 py-2 text-rockies-black/80">{team.losses}</td>
                        <td className="text-center px-1.5 py-2 text-rockies-black/80">{team.ties}</td>
                        <td className="text-center px-1.5 py-2 text-rockies-black/80 font-mono">
                          {team.pct.toFixed(3)}
                        </td>
                        <td className="text-center px-1.5 py-2 text-rockies-black/80">{team.gb}</td>
                        <td className="text-center px-1.5 py-2 text-rockies-black/80">{team.runsFor}</td>
                        <td className="text-center px-1.5 py-2 text-rockies-black/80">{team.runsAgainst}</td>
                        <td className={`text-center px-1.5 py-2 font-medium ${
                          team.diff > 0 ? 'text-green-600' : team.diff < 0 ? 'text-red-500' : 'text-rockies-black/40'
                        }`}>
                          {team.diff > 0 ? `+${team.diff}` : team.diff}
                        </td>
                        <td className={`text-center px-1.5 py-2 font-medium ${
                          team.streak.startsWith('W') ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {team.streak}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column — Game Changer Schedule (live source of truth) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-rockies-silver/30 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-rockies-silver/20 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rockies-purple" />
              <h2 className="font-heading font-bold text-lg text-rockies-black">
                Schedule & Scores
              </h2>
              <span className="ml-auto text-[10px] text-rockies-black/30 uppercase tracking-wide">via Game Changer</span>
            </div>
            <div className="p-3">
              <div
                id="gc-schedule-widget-oli0"
                className="min-h-[500px] rounded-xl overflow-hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
