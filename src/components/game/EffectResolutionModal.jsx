import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EffectResolutionModal({ effect, onResolve, onClose }) {
  if (!effect) return null;

  const isOpponentSide = effect.target === 'opponent';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn(
          "border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl",
          isOpponentSide
            ? "bg-card border-destructive/40"
            : "bg-card border-primary/40"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {isOpponentSide ? (
            <AlertCircle className="w-6 h-6 text-destructive" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          )}
          <h2 className={cn(
            "font-orbitron text-lg font-bold tracking-wider",
            isOpponentSide ? "text-destructive" : "text-primary"
          )}>
            {effect.title}
          </h2>
        </div>

        {/* Description */}
        <p className="text-sm font-rajdhani text-foreground/80 mb-5">
          {effect.description}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {effect.options.map((option, i) => (
            <Button
              key={i}
              onClick={() => {
                onResolve(option.action);
                onClose();
              }}
              className={cn(
                "w-full font-rajdhani text-sm justify-center",
                option.variant === 'default'
                  ? isOpponentSide
                    ? "bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30"
                    : "bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30"
                  : "border border-border/40 text-muted-foreground hover:bg-muted"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}