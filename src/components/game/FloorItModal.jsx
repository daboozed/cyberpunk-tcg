import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FloorItModal({ friendlyUnits, rivalUnits, onSelect, onCancel }) {
  const allUnits = [
    ...friendlyUnits.map(u => ({ ...u, owner: 'player' })),
    ...rivalUnits.map(u => ({ ...u, owner: 'opponent' }))
  ];

  if (allUnits.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-card border border-blue-500 rounded-xl p-4 max-w-md mx-4">
          <h2 className="font-orbitron text-lg font-bold text-blue-400 mb-3">FLOOR IT</h2>
          <p className="text-sm text-muted-foreground mb-4">No valid targets (spent units with cost ≤4).</p>
          <Button onClick={onCancel} variant="outline" className="w-full">Cancel</Button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-blue-500 rounded-xl p-4 max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="font-orbitron text-lg font-bold text-blue-400 mb-2">FLOOR IT</h2>
        <p className="text-xs text-muted-foreground mb-4">Select a spent unit (cost ≤4) to return to hand.</p>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {friendlyUnits.length > 0 && (
            <>
              <div className="text-xs text-cyan-300 font-bold mb-1">FRIENDLY:</div>
              {friendlyUnits.map((unit) => (
                <button
                  key={unit.uid}
                  onClick={() => onSelect(unit, 'player')}
                  className="w-full p-2 rounded border border-cyan-500/30 hover:bg-cyan-500/20 text-left transition-colors text-sm"
                >
                  <div className="font-rajdhani font-bold text-foreground">{unit.name}</div>
                  <div className="text-xs text-muted-foreground">Cost: {unit.cost || 0} • Power: {unit.power || 0}</div>
                </button>
              ))}
            </>
          )}
          {rivalUnits.length > 0 && (
            <>
              <div className="text-xs text-red-400 font-bold mb-1 mt-2">RIVAL:</div>
              {rivalUnits.map((unit) => (
                <button
                  key={unit.uid}
                  onClick={() => onSelect(unit, 'opponent')}
                  className="w-full p-2 rounded border border-red-500/30 hover:bg-red-500/20 text-left transition-colors text-sm"
                >
                  <div className="font-rajdhani font-bold text-foreground">{unit.name}</div>
                  <div className="text-xs text-muted-foreground">Cost: {unit.cost || 0} • Power: {unit.power || 0}</div>
                </button>
              ))}
            </>
          )}
        </div>
        <Button onClick={onCancel} variant="outline" className="w-full">Cancel</Button>
      </div>
    </div>,
    document.body
  );
}