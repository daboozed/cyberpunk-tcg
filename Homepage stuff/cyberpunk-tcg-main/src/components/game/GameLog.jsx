import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GameLog({ logs, alwaysExpanded = false }) {
  const endRef = useRef(null);
const containerRef = useRef(null);

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

  return (
    <div className={cn("flex flex-col h-full rounded-lg overflow-hidden")} style={{ border: '1px solid #00ffff', boxShadow: '0 0 10px rgba(0,255,255,0.2)', background: 'rgba(0,10,20,0.92)' }}>
      <div className="px-3 py-1.5 flex-shrink-0" style={{ background: 'rgba(0,255,255,0.12)', borderBottom: '1px solid #00ffff' }}>
        <p className="text-[10px] font-orbitron font-bold uppercase tracking-widest" style={{ color: '#00ffff', textShadow: '0 0 8px #00ffff' }}>Combat Log</p>
      </div>
      <ScrollArea className="flex-1 p-2 min-h-0">
  <div ref={containerRef} className="space-y-0.5">
          {logs.map((log, i) => (
            <p key={i} className={cn("text-[11px] font-mono leading-snug", getTurnColor(log.msg))}>
              {log.msg}
            </p>
          ))}
          <div ref={endRef} />
        </div>  
      </ScrollArea>
    </div>
  );
}