import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import GigDice from "./GigDice";

const GLOW_COLOR = {
  4: '#f97316', 6: '#f59e0b', 8: '#fb923c',
  10: '#f97316', 12: '#f97316', 20: '#ef4444',
};

export default function DiceRollBox({ rollingDie, result }) {
  const [frame, setFrame] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!rollingDie) { setDone(false); setFrame(0); return; }
    setDone(false);
    setFrame(0);
    let count = 0;
    const total = 8; // fewer frames
    const interval = setInterval(() => {
      count++;
      setFrame(Math.ceil(Math.random() * rollingDie.sides));
      if (count >= total) {
        clearInterval(interval);
        setDone(true);
        setFrame(result);
      }
    }, 50); // faster interval
    return () => clearInterval(interval);
  }, [rollingDie, result]);

  const glow = rollingDie ? (GLOW_COLOR[rollingDie.sides] || '#f97316') : '#f97316';

  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{ minWidth: 72 }}
    >
      <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: glow, opacity: 0.7 }}>
        Roll Box
      </p>
      {/* Hexagon container */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 72, height: 72 }}
      >
        {/* Hexagon SVG background */}
        <svg viewBox="0 0 100 100" width={72} height={72} className="absolute inset-0">
          <defs>
            <filter id="hexglow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polygon
            points="50,4 93,27 93,73 50,96 7,73 7,27"
            fill="#050816"
            stroke={rollingDie ? glow : '#333'}
            strokeWidth="3"
            filter={rollingDie ? "url(#hexglow)" : undefined}
          />
          {/* grid lines inside */}
          <line x1="50" y1="4" x2="50" y2="96" stroke={glow} strokeWidth="0.5" opacity="0.15"/>
          <line x1="7" y1="27" x2="93" y2="73" stroke={glow} strokeWidth="0.5" opacity="0.15"/>
          <line x1="93" y1="27" x2="7" y2="73" stroke={glow} strokeWidth="0.5" opacity="0.15"/>
        </svg>

        {/* Die inside box */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center",
            rollingDie && !done && "animate-spin"
          )}
          style={{
            animationDuration: '0.15s',
          }}
        >
          {rollingDie ? (
            <GigDice
              die={{ ...rollingDie, value: done ? result : frame || undefined }}
              small
            />
          ) : (
            <span className="font-mono text-[9px]" style={{ color: '#444' }}>empty</span>
          )}
        </div>
      </div>

      {/* Result label */}
      {done && result && (
        <p
          className="font-orbitron font-black text-sm leading-none animate-pulse"
          style={{ color: glow, textShadow: `0 0 8px ${glow}` }}
        >
          {result}
        </p>
      )}
    </div>
  );
}