import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

  const rawType =
    typeof card.type === 'string'
      ? card.type
      : typeof card.cardType === 'string'
        ? card.cardType
        : typeof card.type?.type === 'string'
          ? card.type.type
          : 'unit';

  const safeName =
    typeof card.name === 'string'
      ? card.name
      : typeof card.title === 'string'
        ? card.title
        : 'Unknown Card';

  const safeCost =
    typeof card.cost === 'number' || typeof card.cost === 'string'
      ? card.cost
      : 0;

  const safeEffect =
    typeof card.effect === 'string'
      ? card.effect
      : typeof card.text === 'string'
        ? card.text
        : typeof card.type?.text === 'string'
          ? card.type.text
          : '';

  const safeTags = Array.isArray(card.tags)
    ? card.tags.filter(tag => typeof tag === 'string')
    : [];

  const safeGear = Array.isArray(card.gear)
    ? card.gear
    : [];

  const Icon = TYPE_ICONS[rawType] || Sword;
  const colorClass = TYPE_COLORS[rawType] || TYPE_COLORS.unit;
  const power = (Number(card.power) || 0) + (Number(card.powerBonus) || 0);
  const hasBlocker = Array.isArray(card.keywords) && card.keywords.includes('blocker') || card.tempBlocker;
  const hasGoSolo = Array.isArray(card.keywords) && card.keywords.includes('goSolo');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-xs">
        <DialogHeader>
          <DialogTitle className={cn("font-orbitron text-lg flex items-center gap-2", colorClass)}>
            <Icon className="w-5 h-5" />
            {safeName}
          </DialogTitle>

          <DialogDescription className="sr-only">
            Card details for {safeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-background border border-accent/30">
              <span className="text-accent font-orbitron text-sm font-bold">€$ {safeCost}</span>
            </div>
            <span className={cn("text-xs font-mono uppercase tracking-wider", colorClass)}>
              {rawType}
            </span>
          </div>

          {(rawType === 'unit' || rawType === 'legend') && (
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-orbitron font-bold">{power} Power</span>
            </div>
          )}

          {safeTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {safeTags.map(tag => (
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

          {safeEffect && (
            <div className="p-2 rounded bg-muted/50 border border-border/50">
              <p className="text-xs font-rajdhani text-foreground/80">{safeEffect}</p>
            </div>
          )}

          {safeGear.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground font-mono mb-1">EQUIPPED GEAR:</p>
              {safeGear.map((g, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] text-rose-400">
                  <Wrench className="w-3 h-3" />
                  {typeof g?.name === 'string' ? g.name : 'Gear'} (+{Number(g?.powerBonus) || 0})
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}