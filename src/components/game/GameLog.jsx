import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import CardHoverPreview from "./CardHoverPreview";

export default function GameLog({
  logs,
  alwaysExpanded = false,
  cardLookup = {},
  extraHeaderRight = null,
}) {
  const endRef = useRef(null);
  const containerRef = useRef(null);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const box = containerRef.current;
    if (!box) return;

    const nearBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight < 80;

    if (nearBottom) {
      endRef.current?.scrollIntoView({
        behavior: "auto",
        block: "nearest"
      });
    }
  }, [logs.length]);

  const getTurnColor = (msg) => {
    if (msg.startsWith('--- Turn') && msg.includes("Your Turn")) return 'text-cyan-400 font-bold mt-1';
    if (msg.startsWith('--- Turn') && msg.includes("Opponent")) return 'text-red-400 font-bold mt-1';
    if (msg.startsWith('---')) return 'text-primary/60 font-bold mt-1';
    if (msg.includes('WIN') || msg.includes('🏆')) return 'text-accent font-bold';
    if (msg.includes('DEFEAT')) return 'text-destructive font-bold';
    if (msg.includes('ADMIN') || msg.includes('admin')) return 'text-red-500 font-bold';
    if (msg.includes('steals') || msg.includes('Stole')) return 'text-secondary';
    if (msg.includes('destroys') || msg.includes('destroyed')) return 'text-red-400';
    return 'text-muted-foreground/80';
  };

  const findCardByName = (name) => {
    if (!name) return null;

    const key = name.trim().toLowerCase();

    return (
      cardLookup[key] ||
      cardLookup[name.trim()] ||
      null
    );
  };

  const renderMessage = (msg) => {
    const parts = String(msg).split(/(\[[^\]]+\])/g);

    return parts.map((part, index) => {
      const isBracketedCard = part.startsWith("[") && part.endsWith("]");
      if (!isBracketedCard) return <span key={index}>{part}</span>;

      const cardName = part.slice(1, -1).trim();
      const card = findCardByName(cardName);

      return (
        <span
          key={index}
          onMouseEnter={(e) => {
            setHoveredCard(card);
            setMousePos({ x: e.clientX, y: e.clientY });
          }}
          onMouseMove={(e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
          }}
          onMouseLeave={() => setHoveredCard(null)}
          className={cn(
            "px-1 rounded font-bold",
            card
              ? "text-cyan-300 underline decoration-cyan-300/50 cursor-help hover:text-white hover:bg-cyan-500/20"
              : "text-amber-300"
          )}
          title={card ? card.name : "Card not found in lookup"}
        >
          [{cardName}]
        </span>
      );
    });
  };

  return (
    <>
      <div
        className={cn("flex flex-col h-full rounded-lg overflow-hidden")}
        style={{
          border: '1px solid #00ffff',
          boxShadow: '0 0 10px rgba(0,255,255,0.2)',
          background: 'rgba(0,10,20,0.92)',
          position: 'relative',
          zIndex: 9998,
        }}
      >
        <div
  className="px-3 py-1.5 flex-shrink-0 flex items-center justify-between gap-2"
  style={{
    background: 'rgba(0,255,255,0.12)',
    borderBottom: '1px solid #00ffff'
  }}
>
  <p
    className="text-[10px] font-orbitron font-bold uppercase tracking-widest"
    style={{ color: '#00ffff', textShadow: '0 0 8px #00ffff' }}
  >
    Combat Log
  </p>

  {extraHeaderRight}
</div>

        <ScrollArea className="flex-1 p-2 min-h-0">
          <div ref={containerRef} className="space-y-0.5">
            {logs.map((log, i) => {
  const msg = typeof log === "string" ? log : log?.msg || "";

  return (
    <p
      key={i}
      className={cn("text-[11px] font-mono leading-snug", getTurnColor(msg))}
    >
      {renderMessage(msg)}
    </p>
  );
})}
            <div ref={endRef} />
          </div>
        </ScrollArea>
      </div>

      {hoveredCard && (
        <CardHoverPreview card={hoveredCard} mousePos={mousePos} />
      )}
    </>
  );
}