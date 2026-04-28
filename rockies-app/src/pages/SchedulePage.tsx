import { useEffect, useMemo, useState } from 'react';
import { Calendar, Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { getSortedStandings, getTeamRecord, formatRecord, type TeamStanding } from '@/data/standings';

type SortKey = 'rank' | 'team' | 'wins' | 'losses' | 'ties' | 'pct' | 'gb' | 'runsFor' | 'runsAgainst' | 'diff' | 'streak';
type SortDir = 'asc' | 'desc';

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

  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const baseSorted = useMemo(() => getSortedStandings(), []);

  const sortedStandings = useMemo(() => {
    if (sortKey === 'rank') {
      return sortDir === 'asc' ? baseSorted : [...baseSorted].reverse();
    }
    const arr = [...baseSorted];
    arr.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === 'gb') {
        av = a.gb === '-' ? 0 : parseFloat(a.gb);
        bv = b.gb === '-' ? 0 : parseFloat(b.gb);
      } else if (sortKey === 'streak') {
        const score = (s: string) => {
          const sign = s.startsWith('W') ? 1 : s.startsWith('L') ? -1 : 0;
          const n = parseInt(s.slice(1), 10) || 0;
          return sign * n;
        };
        av = score(a.streak);
        bv = score(b.streak);
      } else {
        av = (a as TeamStanding)[sortKey] as number | string;
        bv = (b as TeamStanding)[sortKey] as number | string;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return arr;
  }, [baseSorted, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // Sensible default direction: text ascending, numbers descending (except L/RA where lower is better)
      const ascDefault = key === 'team' || key === 'rank' || key === 'losses' || key === 'runsAgainst' || key === 'gb';
      setSortDir(ascDefault ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 inline-block ml-0.5" /> : <ArrowDown className="w-3 h-3 inline-block ml-0.5" />;
  };

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
                    <th onClick={() => handleSort('rank')} className="text-left px-2 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider w-8 cursor-pointer select-none hover:bg-gray-100">#<SortIcon k="rank" /></th>
                    <th onClick={() => handleSort('team')} className="text-left px-2 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">Team<SortIcon k="team" /></th>
                    <th onClick={() => handleSort('wins')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">W<SortIcon k="wins" /></th>
                    <th onClick={() => handleSort('losses')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">L<SortIcon k="losses" /></th>
                    <th onClick={() => handleSort('ties')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">T<SortIcon k="ties" /></th>
                    <th onClick={() => handleSort('pct')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">PCT<SortIcon k="pct" /></th>
                    <th onClick={() => handleSort('gb')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">GB<SortIcon k="gb" /></th>
                    <th onClick={() => handleSort('runsFor')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">RS<SortIcon k="runsFor" /></th>
                    <th onClick={() => handleSort('runsAgainst')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">RA<SortIcon k="runsAgainst" /></th>
                    <th onClick={() => handleSort('diff')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">DIFF<SortIcon k="diff" /></th>
                    <th onClick={() => handleSort('streak')} className="text-center px-1.5 py-2 font-semibold text-rockies-black/60 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">STRK<SortIcon k="streak" /></th>
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
