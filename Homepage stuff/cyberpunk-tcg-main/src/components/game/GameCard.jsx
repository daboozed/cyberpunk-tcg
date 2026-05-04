import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sword, Shield, Zap, Wrench, Crown } from "lucide-react";
import { CARD_BACK } from "@/lib/cardPool";
import CardHoverPreview from "./CardHoverPreview";

const TYPE_STYLES = {
  unit:    { border: 'border-cyan-500/60',   bg: 'bg-cyan-950/40',   icon: Sword,  accent: 'text-cyan-400' },
  legend:  { border: 'border-amber-500/60',  bg: 'bg-amber-950/40',  icon: Crown,  accent: 'text-amber-400' },
  program: { border: 'border-violet-500/60', bg: 'bg-violet-950/40', icon: Zap,    accent: 'text-violet-400' },
  gear:    { border: 'border-rose-500/60',   bg: 'bg-rose-950/40',   icon: Wrench, accent: 'text-rose-400' },
};

export default function GameCard({
  card,
  onClick,
  selected = false,
  small = false,
  faceDown = false,
  spent = false,
  showDetails = true,
  hideCost = false,
  hideAttackPower = false,
  className = '',
  canAfford = true,
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [equipFlash, setEquipFlash] = useState(false);

  if (!card) return null;

  const style = TYPE_STYLES[card.type] || TYPE_STYLES.unit;
  const Icon = style.icon;
  const imageUrl = card.imageUrl;

  const gearBonus = (card.gear || []).reduce((s, g) => s + (g.powerBonus || 0), 0);
  const power = (card.power || 0) + (card.powerBonus || 0) + gearBonus;

  if (faceDown) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 origin-center border-cyan-500/40",
          small ? "w-14 h-20 md:w-16 md:h-22" : "w-20 h-28 md:w-24 md:h-34",
          spent && "opacity-60 rotate-45",
          className
        )}
        style={{ borderStyle: 'dashed' }}
      >
        <img src={CARD_BACK} className="w-full h-full object-contain bg-black" />
        {spent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold text-red-500 opacity-80">SPENT</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
        className={cn(
           "relative rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden bg-black",
          style.border,
          style.bg,
          selected && "ring-2 ring-primary shadow-lg shadow-primary/30 scale-105",
        spent ? "opacity-60" : "hover:scale-105",
          equipFlash && "ring-2 ring-yellow-400 animate-pulse",
          small ? "w-14 h-20 md:w-16 md:h-22" : "w-20 h-28 md:w-24 md:h-34",
          className
        )}
      >

        {/* GEAR GLOW */}
        {card.gear?.length > 0 && (
           <div className="absolute inset-0 rounded-lg pointer-events-none shadow-[0_0_10px_rgba(255,215,0,0.4)]" />
        )}

        {imageUrl && (
          <img
  src={imageUrl}
  alt={card.name}
  className="absolute inset-0 w-full h-full object-contain"
/>
        )}

        {!hideCost && card.cost !== undefined && (
          <div className="absolute top-0.5 left-0.5 w-7 h-7 rounded-full border-2 border-accent bg-accent/10 flex items-center justify-center">
            <span className="font-bold text-accent text-xs">{card.cost}</span>
          </div>
        )}

        <div className="absolute top-0.5 right-0.5">
          <Icon className={cn("w-4 h-4", style.accent)} />
        </div>

        {!hideAttackPower && (card.type === "unit" || card.type === "legend") && (
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-red-400 bg-red-500/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-red-400">{power}</span>
          </div>
        )}



         {spent && !hideAttackPower && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-bold text-red-500 opacity-80">SPENT</span>
          </div>
        )}
      </div>



      {hovered && imageUrl && (
        <CardHoverPreview card={card} mousePos={mousePos} />
      )}
    </>
  );
}