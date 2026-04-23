import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DICE_IMAGE = "https://media.base44.com/images/public/69c87055481aa236d6027cc9/afa3e4bbe_generated_image.png";

export default function DiceHolderModal({ open, onClose }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-cyan-500/50 rounded-2xl p-8 mx-4 max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-orbitron text-xl font-bold text-cyan-400">DICE COLLECTION</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wooden holder background */}
        <div 
          className="relative rounded-lg overflow-hidden mb-6 p-8 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #654321 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)',
            minHeight: '400px'
          }}
        >
          {/* Wood texture overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Crect fill="%23000" width="100" height="100"/%3E%3Cpath stroke="%23fff" d="M0 0v100M10 0v100M20 0v100M30 0v100M40 0v100M50 0v100M60 0v100M70 0v100M80 0v100M90 0v100" opacity="0.1"/%3E%3C/svg%3E")',
            backgroundSize: '20px 20px'
          }} />

          {/* Dice image */}
          <div className="relative z-10">
            <img 
              src={DICE_IMAGE} 
              alt="Dice Set" 
              className="max-w-sm h-auto drop-shadow-2xl"
            />
          </div>
        </div>

        <p className="text-xs font-mono text-muted-foreground text-center mb-4">
          Premium polyhedral dice set with weathered metal finish
        </p>

        <Button 
          onClick={onClose} 
          className="w-full font-rajdhani bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30"
        >
          Close
        </Button>
      </div>
    </div>,
    document.body
  );
}