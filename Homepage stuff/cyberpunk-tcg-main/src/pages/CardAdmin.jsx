import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Image } from "lucide-react";
import { LEGENDS_POOL, UNITS_POOL, PROGRAMS_POOL, GEAR_POOL } from "@/lib/cardPool";

const ALL_CARDS = [
  ...LEGENDS_POOL,
  ...UNITS_POOL,
  ...PROGRAMS_POOL,
  ...GEAR_POOL,
];

export default function CardAdmin() {
  const [images, setImages] = useState({});
  const [inputUrl, setInputUrl] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const records = await base44.entities.CardImage.list();
    const map = {};
    records.forEach(r => { map[r.card_id] = r; });
    setImages(map);
  }

  async function handleSave(card) {
    const url = inputUrl[card.id] ?? images[card.id]?.image_url ?? "";
    if (!url) return;
    setSaving(s => ({ ...s, [card.id]: true }));
    const existing = images[card.id];
    if (existing) {
      await base44.entities.CardImage.update(existing.id, { image_url: url, card_name: card.name });
    } else {
      await base44.entities.CardImage.create({ card_id: card.id, card_name: card.name, image_url: url });
    }
    await loadImages();
    setInputUrl(prev => ({ ...prev, [card.id]: "" }));
    setSaving(s => ({ ...s, [card.id]: false }));
  }

  async function handleDelete(card) {
    const existing = images[card.id];
    if (!existing) return;
    await base44.entities.CardImage.delete(existing.id);
    await loadImages();
  }

  const TYPE_COLOR = {
    legend: "text-amber-400 border-amber-500/40",
    unit: "text-cyan-400 border-cyan-500/40",
    program: "text-violet-400 border-violet-500/40",
    gear: "text-rose-400 border-rose-500/40",
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/play">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="font-orbitron text-xl font-bold text-primary tracking-wider">CARD IMAGE MANAGER</h1>
      </div>

      <div className="space-y-3">
        {ALL_CARDS.map(card => {
          const rec = images[card.id];
          const url = inputUrl[card.id] ?? "";
          const currentUrl = rec?.image_url;

          return (
            <div key={card.id} className={`flex items-center gap-3 p-3 rounded-xl border bg-card/50 ${TYPE_COLOR[card.type] || "border-border"}`}>
              {/* Preview */}
              <div className="w-12 h-16 flex-shrink-0 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center">
                {currentUrl
                  ? <img src={currentUrl} alt={card.name} className="w-full h-full object-cover" />
                  : <Image className="w-5 h-5 text-muted-foreground/30" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-rajdhani font-bold text-sm truncate">{card.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">{card.type} · {card.id}</p>
                <input
                  type="url"
                  placeholder="Paste image URL…"
                  value={url}
                  onChange={e => setInputUrl(prev => ({ ...prev, [card.id]: e.target.value }))}
                  className="mt-1 w-full bg-background border border-border/50 rounded px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleSave(card)}
                  disabled={saving[card.id] || (!url && !currentUrl)}
                  className="text-xs font-rajdhani bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {saving[card.id] ? "…" : currentUrl ? "Update" : "Save"}
                </Button>
                {currentUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(card)}
                    className="text-xs font-rajdhani border-destructive/40 text-destructive hover:bg-destructive/10 h-7 px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}