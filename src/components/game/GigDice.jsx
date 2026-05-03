import { useState, useRef, useEffect } from "react";

export default function GigDice({
  die,
  onClick,
  selectable = false,
  small = false,
  disabled = false,
  index,
  player
}) {
  const [displayValue, setDisplayValue] = useState(die?.value ?? null);
  const [rolling, setRolling] = useState(false);
  const rollingRef = useRef(false);

  // Sync UI whenever parent die value changes
  useEffect(() => {
    if (!rollingRef.current) {
      setDisplayValue(die?.value ?? null);
    }
  }, [die?.value]);

  return (
    <div
      key={`${die?.id}-${die?.value}`}
      onClick={
        selectable && !disabled
          ? () => {
              if (rolling) return;

              setRolling(true);
              rollingRef.current = true;

              let ticks = 0;
              const finalResult =
                Math.floor(Math.random() * die.sides) + 1;

              const interval = setInterval(() => {
                setDisplayValue(
                  Math.floor(Math.random() * die.sides) + 1
                );

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
      title={die?.label}
      className="flex items-center justify-center border border-white bg-black text-white"
      style={{
        width: small ? 36 : 45,
        height: small ? 36 : 45,
        fontSize: small ? 18 : 24,
        opacity: selectable && !disabled ? 1 : 0.4,
        cursor:
          selectable && !disabled ? "pointer" : "not-allowed"
      }}
    >
      {displayValue === null ? `d${die?.sides}` : displayValue}
    </div>
  );
}