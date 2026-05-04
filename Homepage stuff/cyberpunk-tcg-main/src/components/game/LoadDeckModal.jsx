import { useState } from "react";
import { X, Trash2, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALPHA_KIT_ARASAKA = {
  id: 'alpha_arasaka',
  name: 'Alpha Kit — Arasaka Deck',
  readOnly: true,
  legends: ['l0', 'l4', 'l3'],
  mainDeck: [
    { id: 'g1', count: 3 },
    { id: 'g5', count: 2 },
    { id: 'g2', count: 2 },
    { id: 'p3', count: 3 },
    { id: 'p7', count: 3 },
    { id: 'u2', count: 3 },
    { id: 'u5', count: 2 },
    { id: 'u1', count: 3 },
    { id: 'u8', count: 3 },
    { id: 'u9', count: 2 },
    { id: 'u6', count: 1 },
  ],
};

const ALPHA_KIT_MERC = {
  id: 'alpha_merc',
  name: 'Alpha Kit — Merc Deck',
  readOnly: true,
  legends: ['l11', 'l12', 'l7'],
  mainDeck: [
    { id: 'g3', count: 3 },
    { id: 'g4', count: 2 },
    { id: 'g6', count: 2 },
    { id: 'p2', count: 3 },
    { id: 'p1', count: 3 },
    { id: 'u10', count: 3 },
    { id: 'u15', count: 2 },
    { id: 'u16', count: 3 },
    { id: 'u3', count: 3 },
    { id: 'u7', count: 2 },
    { id: 'u4', count: 1 },
  ],
};

function loadLocalDecks() {
  try {
    const all = JSON.parse(localStorage.getItem('cpTCG_saved_decks') || '[]');
    return all;
  } catch { return []; }
}

function deleteLocalDeck(id) {
  const all = loadLocalDecks().filter(d => d.id !== id);
  localStorage.setItem('cpTCG_saved_decks', JSON.stringify(all));
}

export default function LoadDeckModal({ onClose, onLoad }) {
  const [localDecks, setLocalDecks] = useState(loadLocalDecks);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleLoad = (deck) => {
    onLoad(deck);
    onClose();
  };

  const handleDeleteConfirmed = () => {
    deleteLocalDeck(confirmDelete.id);
    setLocalDecks(loadLocalDecks());
    setConfirmDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 flex-shrink-0">
          <h2 className="font-orbitron text-base font-bold text-primary tracking-wider">LOAD DECK</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Pre-built decks */}
          <p className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">Pre-Built Decks</p>
          {[ALPHA_KIT_ARASAKA, ALPHA_KIT_MERC].map(deck => (
            <div key={deck.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
              <Lock className="w-4 h-4 text-amber-400/60 flex-shrink-0" />
              <span className="flex-1 font-rajdhani font-bold text-sm text-amber-300">{deck.name}</span>
              <Button
                size="sm"
                onClick={() => handleLoad(deck)}
                className="font-rajdhani text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 gap-1 h-7 px-3"
              >
                Load <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Your Saved Decks</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Local decks */}
          {localDecks.length === 0 && (
            <p className="text-center text-sm font-mono text-muted-foreground/50 py-4">No saved decks found.</p>
          )}
          {localDecks.map(deck => (
            <div key={deck.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors">
              <span className="flex-1 font-rajdhani font-bold text-sm text-foreground truncate">{deck.name}</span>
              <Button
                size="sm"
                onClick={() => handleLoad(deck)}
                className="font-rajdhani text-xs bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 gap-1 h-7 px-3"
              >
                Load <ChevronRight className="w-3 h-3" />
              </Button>
              <button
                onClick={() => setConfirmDelete(deck)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60" onClick={() => setConfirmDelete(null)}>
          <div className="bg-card border border-destructive/40 rounded-xl p-6 mx-4 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-orbitron text-base font-bold text-destructive mb-2">Delete Deck?</h3>
            <p className="font-rajdhani text-sm text-foreground/70 mb-5">
              Are you sure you want to delete <span className="text-foreground font-bold">"{confirmDelete.name}"</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-rajdhani text-sm border-border/50" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button className="flex-1 font-rajdhani text-sm bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30" onClick={handleDeleteConfirmed}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}