import { useState, useEffect } from 'react';
import { X, Trash2, ArrowRight, Loader2, Calendar, Clock } from 'lucide-react';
import { loadAllLineups, deleteLineup, type SavedLineup } from '@/lib/lineup-storage';

interface SavedLineupsModalProps {
  open: boolean;
  onClose: () => void;
  onLoadLineup: (gameId: string) => void;
}

export default function SavedLineupsModal({ open, onClose, onLoadLineup }: SavedLineupsModalProps) {
  const [lineups, setLineups] = useState<SavedLineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadAllLineups()
      .then(setLineups)
      .catch((err) => console.error('Failed to load lineups:', err))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleDelete(gameId: string) {
    setDeletingId(gameId);
    try {
      await deleteLineup(gameId);
      setLineups((prev) => prev.filter((l) => l.id !== gameId));
    } catch (err) {
      console.error('Failed to delete lineup:', err);
    } finally {
      setDeletingId(null);
    }
  }

  function handleLoad(gameId: string) {
    onLoadLineup(gameId);
    onClose();
  }

  function formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest bg-gradient-to-r from-rockies-purple to-rockies-deep-purple">
          <h2 className="text-lg font-heading font-bold text-white">My Saved Lineups</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-rockies-black/50">
              <Loader2 className="w-6 h-6 animate-spin text-rockies-purple" />
              <span className="text-sm">Loading lineups...</span>
            </div>
          ) : lineups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-rockies-black/40">
              <Calendar className="w-8 h-8" />
              <p className="text-sm font-medium">No saved lineups yet</p>
              <p className="text-xs text-center">Save a lineup from the lineup builder<br />and it will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {lineups.map((lineup) => (
                <div
                  key={lineup.id}
                  className="border border-surface-container-highest rounded-xl p-4 bg-surface/40 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-rockies-black truncate">
                        {lineup.gameName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-rockies-black/50">
                          <Calendar className="w-3 h-3" />
                          {lineup.gameDate}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-rockies-black/40">
                          <Clock className="w-3 h-3" />
                          Saved {formatTimestamp(lineup.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleLoad(lineup.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rockies-purple hover:brightness-110 transition-all"
                    >
                      Load
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(lineup.id)}
                      disabled={deletingId === lineup.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deletingId === lineup.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
