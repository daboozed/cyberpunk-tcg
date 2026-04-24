import { cn } from "@/lib/utils";
import { PHASES } from "@/lib/engine/helpers";
 
const PHASE_LABELS = {
  [PHASES.SETUP]: 'SETUP',
  [PHASES.MULLIGAN]: 'MULLIGAN',
  [PHASES.READY]: 'READY',
  'pick_gig': 'PICK GIG',
  [PHASES.PLAY]: 'PLAY',
  [PHASES.ATTACK]: 'ATTACK',
  [PHASES.OPPONENT_TURN]: 'RIVAL TURN',
  [PHASES.GAME_OVER]: 'GAME OVER',
};

const PHASE_COLORS = {
  [PHASES.SETUP]: 'border-muted-foreground text-muted-foreground',
  [PHASES.MULLIGAN]: 'border-amber-400 text-amber-400',
  [PHASES.READY]: 'border-cyan-400 text-cyan-400',
  'pick_gig': 'border-violet-400 text-violet-400',
  [PHASES.PLAY]: 'border-green-400 text-green-400',
  [PHASES.ATTACK]: 'border-red-400 text-red-400',
  [PHASES.OPPONENT_TURN]: 'border-orange-400 text-orange-400',
  [PHASES.GAME_OVER]: 'border-amber-400 text-amber-400',
};

export default function PhaseIndicator({ phase, turn, overtime }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs" style={{ color: 'rgba(0,255,255,0.5)' }}>TURN {turn}</span>
      <div
        className={cn("px-3 py-1 font-orbitron text-xs font-bold tracking-widest", PHASE_COLORS[phase] || 'text-primary')}
        style={{ border: '1px solid currentColor', borderRadius: 4, textShadow: '0 0 8px currentColor' }}
      >
        {PHASE_LABELS[phase] || phase}
      </div>
      {overtime && (
        <span className="px-2 py-0.5 rounded text-[10px] font-orbitron font-bold animate-pulse" style={{ background: 'rgba(255,51,102,0.2)', border: '1px solid rgba(255,51,102,0.5)', color: '#ff3366' }}>
          OVERTIME
        </span>
      )}
    </div>
  );
}