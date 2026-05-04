import { useState } from "react";
import { X, Save, Crown, Swords, Zap, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { LEGENDS_POOL, UNITS_POOL, PROGRAMS_POOL, GEAR_POOL } from "@/lib/cardPool";

const MAX_SAVES = 5;

function loadSavedDecks() {
  try { return JSON.parse(localStorage.getItem('cpTCG_saved_decks') || '[]'); } catch { return []; }
}

export default function SaveDeckModal({ deckName: initialName, legends, mainDeck, onClose, onSaved }) {
  const [name, setName] = useState('');

  const savedDecks = loadSavedDecks();
  const atCap = savedDecks.length >= MAX_SAVES && !savedDecks.find(d => d.name === name);

  // Stats
  const unitCount   = mainDeck.filter(e => UNITS_POOL.find(c => c.id === e.id)).reduce((s, e) => s + e.count, 0);
  const programCount= mainDeck.filter(e => PROGRAMS_POOL.find(c => c.id === e.id)).reduce((s, e) => s + e.count, 0);
  const gearCount   = mainDeck.filter(e => GEAR_POOL.find(c => c.id === e.id)).reduce((s, e) => s + e.count, 0);

  const stats = [
    { icon: Crown,  label: 'Legends',  count: legends.length,  color: 'text-amber-400' },
    { icon: Swords, label: 'Units',    count: unitCount,        color: 'text-cyan-400' },
    { icon: Zap,    label: 'Programs', count: programCount,     color: 'text-violet-400' },
    { icon: Wrench, label: 'Gear',     count: gearCount,        color: 'text-rose-400' },
  ];

  const handleSave = () => {
    if (!name.trim()) return;
    const decks = loadSavedDecks();
    const existing = decks.find(d => d.name === name);
    if (!existing && decks.length >= MAX_SAVES) return;

    const entry = { id: existing?.id || ('deck_' + Date.now()), name, legends, mainDeck };
    if (existing) {
      const idx = decks.findIndex(d => d.name === name);
      decks[idx] = entry;
    } else {
      decks.push(entry);
    }
    localStorage.setItem('cpTCG_saved_decks', JSON.stringify(decks));
    localStorage.setItem('cpTCG_deck', JSON.stringify(entry));
    onSaved(name);
    onClose();
  };

  const isOverwrite = savedDecks.some(d => d.name === name);
  const canSave = !atCap;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h2 className="font-orbitron text-base font-bold text-primary tracking-wider">SAVE DECK</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Deck name input */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Deck Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={32}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 font-rajdhani font-bold text-foreground text-sm outline-none focus:border-primary/60 transition-colors"
              placeholder="Enter deck name..."
            />
            {isOverwrite && (
              <p className="text-[11px] font-mono text-amber-400/80 mt-1">⚠ This will overwrite an existing save.</p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {stats.map(({ icon: Icon, label, count, color }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
                <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                <div>
                  <p className={`font-orbitron font-bold text-sm leading-none ${color}`}>{count}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Save slots indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Save Slots</span>
              <span className={`text-[11px] font-mono font-bold ${savedDecks.length >= MAX_SAVES ? 'text-red-400' : 'text-green-400'}`}>
                {savedDecks.length}/{MAX_SAVES}
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_SAVES }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    i < savedDecks.length ? 'bg-primary/70' : 'bg-muted/40 border border-border/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={!canSave || !name.trim()}
            className="w-full font-rajdhani font-bold text-sm bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 disabled:opacity-40 gap-2"
          >
            <Save className="w-4 h-4" />
            {isOverwrite ? 'Overwrite Save' : 'Save Deck'}
          </Button>

          {atCap && (
            <p className="text-center text-[11px] font-mono text-red-400/70">
              Save slots full. Delete a deck to save a new one.
            </p>
          )}

          {/* Footer note */}
          <p className="text-center text-[11px] font-mono text-muted-foreground/40">
            More deck save slots coming soon!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}