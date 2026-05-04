import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Sword, Shield, Zap, Wrench, Crown, ChevronRight } from "lucide-react";

const TYPE_ICONS = {
  unit: Sword,
  legend: Crown,
  program: Zap,
  gear: Wrench,
};

const TYPE_COLORS = {
  unit: 'text-cyan-400 border-cyan-500/50',
  legend: 'text-amber-400 border-amber-500/50',
  program: 'text-violet-400 border-violet-500/50',
  gear: 'text-rose-400 border-rose-500/50',
};

export default function CardDetailModal({ card, open, onClose }) {
  if (!card) return null;

  const Icon = TYPE_ICONS[card.type] || Sword;
  const colorClass = TYPE_COLORS[card.type] || TYPE_COLORS.unit;
  const power = (card.power || 0) + (card.powerBonus || 0);
  const hasBlocker = card.keywords?.includes('blocker') || card.tempBlocker;
  const hasGoSolo = card.keywords?.includes('goSolo');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-xs">
        <DialogHeader>
          <DialogTitle className={cn("font-orbitron text-lg flex items-center gap-2", colorClass)}>
            <Icon className="w-5 h-5" />
            {card.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-background border border-accent/30">
              <span className="text-accent font-orbitron text-sm font-bold">€$ {card.cost}</span>
            </div>
            <span className={cn("text-xs font-mono uppercase tracking-wider", colorClass)}>
              {card.type}
            </span>
          </div>

          {(card.type === 'unit' || card.type === 'legend') && (
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-orbitron font-bold">{power} Power</span>
            </div>
          )}

          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.tags.map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {hasBlocker && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30">
                <Shield className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-blue-400 font-mono">BLOCKER</span>
              </div>
            )}
            {hasGoSolo && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30">
                <ChevronRight className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400 font-mono">GO SOLO</span>
              </div>
            )}
          </div>

          {card.effect && (
            <div className="p-2 rounded bg-muted/50 border border-border/50">
              <p className="text-xs font-rajdhani text-foreground/80">{card.effect}</p>
            </div>
          )}

          {card.gear && card.gear.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-mono mb-1">EQUIPPED GEAR:</p>
              {card.gear.map((g, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] text-rose-400">
                  <Wrench className="w-3 h-3" />
                  {g.name} (+{g.powerBonus || 0})
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}