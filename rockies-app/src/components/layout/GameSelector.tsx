import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface GameInfo {
  id: string;
  gameNumber: number;
  opponent: string;
  date: string; // Display-ready string like "Mar 22, 2026"
}

interface GameSelectorProps {
  games: GameInfo[];
  currentGameIndex: number;
  onGameChange: (index: number) => void;
}

export default function GameSelector({ games, currentGameIndex, onGameChange }: GameSelectorProps) {
  const currentGame = games[currentGameIndex];
  const hasPrev = currentGameIndex > 0;
  const hasNext = currentGameIndex < games.length - 1;

  if (!currentGame) return null;

  return (
    <div className="bg-surface-container border-b border-surface-container-highest">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Previous game */}
          <button
            onClick={() => hasPrev && onGameChange(currentGameIndex - 1)}
            disabled={!hasPrev}
            className={`p-2 rounded-lg transition-colors ${
              hasPrev
                ? 'text-rockies-purple hover:bg-surface-container-high cursor-pointer'
                : 'text-surface-container-highest cursor-not-allowed'
            }`}
            aria-label="Previous game"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Current game display */}
          <div className="flex items-center gap-2 text-center">
            <div className="w-1.5 h-1.5 rounded-full bg-rockies-purple" />
            <span className="font-heading font-semibold text-sm sm:text-base text-rockies-black">
              Game {currentGame.gameNumber}
            </span>
            <span className="text-rockies-black/60 text-sm">
              vs {currentGame.opponent}
            </span>
            <span className="hidden sm:inline text-rockies-black/40 text-sm">
              — {currentGame.date}
            </span>
          </div>

          {/* Next game */}
          <button
            onClick={() => hasNext && onGameChange(currentGameIndex + 1)}
            disabled={!hasNext}
            className={`p-2 rounded-lg transition-colors ${
              hasNext
                ? 'text-rockies-purple hover:bg-surface-container-high cursor-pointer'
                : 'text-surface-container-highest cursor-not-allowed'
            }`}
            aria-label="Next game"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
