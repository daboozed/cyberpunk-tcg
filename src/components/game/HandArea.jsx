import { cn } from "@/lib/utils";
import GameCard from "./GameCard";

export default function HandArea({
  hand,
  onCardClick,
  onPlayCard,
  onSellCard,
  selectedCard,
  phase,
  availableEddies = 0
}) {
  if (!hand || hand.length === 0) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-xs text-muted-foreground/50 font-mono">Hand empty</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-1.5">
        <p className="text-[10px] font-orbitron font-bold uppercase tracking-widest" style={{ color: '#00ffff', textShadow: '0 0 6px #00ffff' }}>Your Hand</p>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(0,255,255,0.4)' }}>({hand.length} cards)</span>
      </div>
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {(hand || []).map((card, i) => {
  if (!card) return null;

  const canSell = card.sellable === true;
  const canAfford = (availableEddies >= (card.cost || 0));

  return (
    <div
      key={card.uid}
      className="relative flex-shrink-0 group transition-transform duration-200 hover:-translate-y-2"
    >

  <GameCard
    card={card}
    selected={selectedCard === i}
    onClick={() => onCardClick(i)}
    small={false}
    canAfford={canAfford}
  />

  {/* 🔥 ACTION BUTTONS */}
  <div
  className="absolute bottom-0 left-0 right-0 flex z-10"
  onClick={(e) => e.stopPropagation()}
>

    {/* PLAY */}
    <button
  disabled={!canAfford || phase !== "play"}
  onClick={(e) => {
    e.stopPropagation();
    onPlayCard?.(i);
  }}
  className={cn(
    "flex-1 text-xs font-bold py-1 transition-all duration-150",
    "border border-green-400",
    "bg-gradient-to-b from-green-600 to-green-800",
    "shadow-[0_0_6px_rgba(0,255,150,0.6)]",
    "hover:scale-105 hover:shadow-[0_0_12px_rgba(0,255,150,1)]",
    "active:scale-95",
    canAfford && phase === "play"
      ? "text-white"
      : "bg-gray-800 text-gray-500 border-gray-600 cursor-not-allowed shadow-none"
  )}
>
  PLAY
</button>

    {/* SELL */}
    <button
  disabled={!canSell || phase !== "play"}
  onClick={(e) => {
    e.stopPropagation();
    if (!canSell) return;
    onSellCard?.(i);
  }}
  className={cn(
    "flex-1 text-xs font-bold py-1 transition-all duration-150 border",

    // ✅ SELLABLE
    canSell && phase === "play"
      ? "border-yellow-400 bg-gradient-to-b from-yellow-500 to-yellow-700 text-black shadow-[0_0_6px_rgba(255,200,0,0.6)] hover:scale-105"

      // ❌ NOT SELLABLE
      : "border-gray-600 bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 shadow-none"
  )}
>
  SELL
</button>

  </div>

</div>
          );
        })}
      </div>
    </div>
  );
}
