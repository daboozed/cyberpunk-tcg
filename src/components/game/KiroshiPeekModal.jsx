import { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LEGEND_BACK } from "@/lib/cardPool";

export default function KiroshiPeekModal({ opponentLegends, onClose }) {
  const [peekedLegend, setPeekedLegend] = useState(null);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-yellow-400/60 rounded-2xl p-6 mx-4 max-w-lg w-full shadow-2xl shadow-yellow-400/20">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-5 h-5 text-yellow-400" />
          <h2 className="font-orbitron text-base font-bold text-yellow-400 tracking-wider">KIROSHI OPTICS</h2>
        </div>
        <p className="text-xs font-mono text-muted-foreground mb-5">
          {peekedLegend
            ? "You are viewing this Legend — only you can see it."
            : "Choose one of your Legends to peek at. Only you can see it."}
        </p>

        {opponentLegends.length === 0 ? (
          <p className="text-sm font-mono text-muted-foreground/60 text-center py-4">
            No Legends to peek at.
          </p>
        ) : peekedLegend ? (
          <div className="flex flex-col items-center gap-3 mb-5">
            <div className="relative w-36 h-52 rounded-xl border-2 border-yellow-400 shadow-lg shadow-yellow-400/30 overflow-hidden bg-gradient-to-br from-yellow-900 to-black flex items-center justify-center">
              {peekedLegend.imageUrl ? (
                <img
                  src={peekedLegend.imageUrl}
                  alt={peekedLegend.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center px-2">
                  <p className="font-orbitron text-[11px] font-bold text-yellow-300">{peekedLegend.name}</p>
                  {peekedLegend.subtitle && (
                    <p className="text-[9px] font-mono text-yellow-200/70 mt-1">{peekedLegend.subtitle}</p>
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 p-2 text-center pointer-events-none">
                <p className="font-orbitron text-[10px] font-bold text-white leading-tight">{peekedLegend.name}</p>
                {peekedLegend.subtitle && (
                  <p className="text-[9px] font-mono text-yellow-300 mt-0.5">{peekedLegend.subtitle}</p>
                )}
              </div>
              <div className="absolute top-1.5 right-1.5 bg-yellow-400/90 rounded-full p-0.5 pointer-events-none">
                <Eye className="w-2.5 h-2.5 text-black" />
              </div>
            </div>
            {peekedLegend.effect && (
              <p className="text-[10px] font-mono text-yellow-300/80 max-w-xs text-center leading-relaxed">
                {peekedLegend.effect}
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-4 justify-center mb-5 flex-wrap">
            {opponentLegends.map((legend, idx) => (
              <div key={legend.uid || idx} className="relative">
                <span className="absolute -top-1 -right-1 z-10 text-[7px] font-mono font-bold px-1 rounded-sm" style={{ background: 'rgba(0,0,0,0.75)', color: '#facc15', border: '1px solid rgba(250,204,21,0.4)' }}>#{idx + 1}</span>
                <button
  disabled={legend.faceUp}
  onClick={() => {
    if (!legend.faceUp) setPeekedLegend(legend)
  }}
  className={cn(
    "group relative w-28 h-40 rounded-xl border-2 overflow-hidden transition-all duration-200",
    legend.faceUp
      ? "border-yellow-400/40 opacity-60 cursor-not-allowed"
      : "border-border/40 hover:border-yellow-400/70 hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/20 cursor-pointer"
  )}
>
                  <img
                    src={legend.faceUp ? legend.imageUrl : LEGEND_BACK}
                    alt={legend.faceUp ? legend.name : "Legend"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-2">
  <span className="text-[9px] font-mono text-yellow-300/70 uppercase tracking-widest">
    {legend.faceUp ? "Visible" : "Peek"}
  </span>
</div>
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full font-rajdhani font-bold bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/20 gap-2"
        >
          <X className="w-4 h-4" />
          Close
        </Button>
      </div>
    </div>,
    document.body
  );
}