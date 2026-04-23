import { useState, useRef } from "react";

export default function GigDice({ die, onClick, selectable = false, small = false, disabled = false, index, player }) {
const [displayValue, setDisplayValue] = useState(
  die?.value ?? null
);  
const [rolling, setRolling] = useState(false);
const rollingRef = useRef(false);

// keep display in sync when not rolling

  
  return (
  <div
    onClick={
  selectable && !disabled
    ? () => {
        console.log("CLICKED DIE");

        if (rolling) return;

        setRolling(true);
        rollingRef.current = true;
        setDisplayValue(Math.floor(Math.random() * die.sides) + 1);

        let ticks = 0;
        let finalResult = Math.floor(Math.random() * die.sides) + 1;

        const interval = setInterval(() => {
          const next = Math.floor(Math.random() * die.sides) + 1;
          setDisplayValue(next);
          ticks++;

          if (ticks > 12) {
            clearInterval(interval);

            setDisplayValue(finalResult);
            setRolling(false);
            rollingRef.current = false;

            setTimeout(() => {
              onClick?.(player, index, finalResult);
            }, 150);
          }
        }, 80);
      }
    : undefined
}
    title={die.label}
    className="flex items-center justify-center border border-white bg-black text-white"
    style={{
      width: 45,
      height: 45,
      fontSize: 24,
      opacity: selectable && !disabled ? 1 : 0.4,
      cursor: selectable && !disabled ? "pointer" : "not-allowed",
          }}
  >
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
  {displayValue === null ? (
    <div style={{ fontSize: 14 }}>
      d{die.sides}
    </div>
  ) : (
    <div style={{ fontSize: 20 }}>
      {displayValue}
    </div>
  )}
</div>
  </div>
);
}
