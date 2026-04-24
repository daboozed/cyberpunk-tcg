  import { useState } from "react";
  import UnitWithGear from "./UnitWithGear";
  import GigDice from "./GigDice";
  import { getAvailableEddies, getAvailableLegendEddies, PHASES } from "@/lib/engine/helpers";
  import { LEGEND_BACK, CARD_BACK } from "@/lib/cardPool";
  import CardHoverPreview from "./CardHoverPreview";
  import { cn } from "@/lib/utils";

  const GIG_STYLES = {
    20: { clipPath: "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)", color: "#ff3366" },
    12: { clipPath: "polygon(50% 0%, 85% 20%, 100% 50%, 85% 80%, 50% 100%, 15% 80%, 0% 50%, 15% 20%)", color: "#ffcc00" },
    10: { clipPath: "polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%, 0% 30%)", color: "#00ff99" },
    8:  { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", color: "#00ccff" },
    6:  { clipPath: "none", color: "#ffffff" },
    4:  { clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", color: "#ff8800" },
  };

  function GigPlaceholder({ sides, borderColor }) {
    const style = GIG_STYLES[sides];
    return (
      <div style={{ width: 48, height: 48, opacity: 0.3 }}>
        <div style={{
          width: "100%", height: "100%",
          clipPath: style.clipPath,
          border: `1px dashed ${borderColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10,
        }}>
          D{sides}
        </div>
      </div>
    );
  }

  function LegendsRow({ legends, borderColor, onLegendClick, onHover, onLeave }) {

  const safeLegends = Array.isArray(legends)
    ? legends.map(l => (l && typeof l === "object" ? l : null))
    : [];

    return (
      <div>
        <p className="text-xs font-orbitron mb-1" style={{ color: borderColor }}>LEGENDS</p>
        <div
    className="flex gap-1 p-1 rounded-md"
    style={{
      border: `1px dashed ${borderColor}`,
      width: "176px",   // 👈 EXACT WIDTH FOR 3 CARDS
    }}
  >
          {[0, 1, 2].map((i) => {
            
  const legend = safeLegends[i];

// GO SOLO SLOT PLACEHOLDER
if (legend?.goSoloActive) {
  return (
    <div
      key={`solo-${i}`}
      className="w-14 h-20 flex items-center justify-center text-[9px] opacity-60"
      style={{
        border: `2px dashed ${borderColor}`,
        background: "rgba(255,255,255,0.03)",
        filter: "grayscale(100%)",
        pointerEvents: "none",
      }}
    >
      SOLO
    </div>
  );
}



// EMPTY SLOT
if (!legend || typeof legend !== "object" || !legend.uid) {
  return (
    <div
      key={i}
      className="w-14 h-20 flex items-center justify-center text-[10px]"
      style={{ border: "1px dashed " + borderColor }}
    >
      EMPTY
    </div>
  );
}
            return (
              <div
    key={legend?.uid ?? `legend-${i}`}
    onClick={() => onLegendClick?.(i)}
    onMouseEnter={() => legend?.faceUp && onHover?.(legend)}
    onMouseLeave={() => onLeave?.()}
    className="cursor-pointer"
  >
    <img
    src={legend?.faceUp && legend?.imageUrl ? legend.imageUrl : LEGEND_BACK}
    className="w-14 h-20 block transition-all duration-200"
    style={{
      transform: legend?.spent ? "rotate(45deg)" : "rotate(0deg)",
      marginRight: legend?.spent ? "12px" : "4px",
      boxShadow: "0 0 6px rgba(0,255,255,0.25)",
    }}
  />
  </div>
            );
          })}
        </div>
      </div>
    );
  }

function TrashZone({ trash = [], borderColor }) {
  const topCard = trash[trash.length - 1];

  return (
    <div className="flex flex-col items-start">
      <p
        className="text-xs font-orbitron mb-1"
        style={{ color: borderColor }}
      >
        TRASH ({trash.length})
      </p>

      <div
        className="rounded-md p-1 flex items-center justify-center"
        style={{
          width: "56px",
          height: "88px",
          border: `1px dashed ${borderColor}`,
        }}
      >
        {topCard ? (
          <img
            src={topCard.imageUrl || CARD_BACK}
            className="w-14 h-20 object-cover rounded"
            style={{
              boxShadow: "0 0 8px rgba(255,0,120,0.35)"
            }}
          />
        ) : (
          <span className="text-[9px] opacity-30">EMPTY</span>
        )}
      </div>
    </div>
  );
}

  function FieldArea({ field, borderColor, selectedAttacker, onFieldUnitClick, phase }) {
  const isAttackPhase = phase === PHASES.ATTACK;

  return (
    <div
      className="w-full max-w-[700px] flex flex-wrap justify-start gap-2 p-2 rounded-lg"
      style={{ border: `1px dashed ${borderColor}`, minHeight: "100px" }}
    >
      {(field || []).map((unit) => {
        if (!unit) return null;

        const canAttack =
          isAttackPhase &&
          !unit.spent &&
          !unit.justPlayed &&
          !unit.cantAttack;

        return (
          <div key={unit.uid} className="relative flex flex-col items-center">

            {/* 🔥 ATTACK BUTTON */}
            {canAttack && (
              <button
                onClick={() => onFieldUnitClick?.(unit)}
                className="absolute -top-3 z-10 bg-red-600 text-white text-[10px] px-2 py-[2px] rounded border border-red-300 shadow-[0_0_10px_rgba(255,0,0,0.8)] hover:scale-110 transition"
              >
                ATTACK
              </button>
            )}

            <UnitWithGear
              unit={unit}
              selected={selectedAttacker === unit.uid}
              onClick={() => onFieldUnitClick?.(unit)}
            />
          </div>
        );
      })}
    </div>
  );
}
  export default function PlayerArea({
    player,
    isOpponent = false,
    phase, // 🔥 ADD THIS
    onLegendClick,
    onFieldUnitClick,
    disableDice = false,
    onFixerDieClick,  
    selectedAttacker,
    playerLabel,
    onAttackGig, // 🔥 ADD THIS
  }) {
    
  // HOOKS FIRST (must always be first)
  const [hoveredLegend, setHoveredLegend] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  // THEN derived values
  const availableEddies =
    getAvailableEddies(player) +
    getAvailableLegendEddies(player);
  const streetCred =
    (player.gigDice || []).reduce(
      (sum, d) => sum + (d.value || 0),
      0
    );
  const isAttackPhase = phase === PHASES.ATTACK;
  const hasAttacker = !!selectedAttacker;
  const hasUnitTargets =
    (player.field || []).some(u => u && u.spent);
  const hasGigTargets =
    (player.gigDice?.length || 0) > 0;
  const canAttackUnits =
    isAttackPhase && hasAttacker && hasUnitTargets;
  const canAttackGigs =
    isAttackPhase && hasAttacker && hasGigTargets;
  const borderColor =
    isOpponent ? "#ff3366" : "#00ffff";
    return (
      <div
        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
        className="w-full max-w-[1200px] mx-auto rounded-lg p-2 relative"
        style={{
          background: isOpponent ? "rgba(20,0,10,0.92)" : "rgba(0,10,20,0.92)",
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* HEADER */}
        <div className="flex justify-between mb-2 text-xs">
          <span style={{ color: borderColor }}>
            {playerLabel || (isOpponent ? "Player 2" : "Player 1")}
          </span>
          <span style={{ color: "#00ffff" }}>★ {streetCred}</span>
        </div>

        <div className="grid grid-cols-12 gap-3">

          {/* LEFT: FIXER DICE */}
          <div className="col-span-2 flex flex-col gap-2">
            {(player.fixerArea || []).map((fixerDie, index) => {
    if (!fixerDie) return null;
    const sides = fixerDie.sides;

    return (
      <GigDice
    key={`${player.id}-fixer-${fixerDie.sides}-${index}`}
    die={fixerDie}
    player={player}          // 🔥 ADD THIS
    index={index}            // 🔥 ADD THIS
    selectable={
  !isOpponent &&
  !disableDice &&
  (
    fixerDie.sides !== 20 ||
    (player.fixerArea || []).filter(d => d && d.sides !== 20).length === 0
  )
}
    onClick={(playerArg, indexArg, result) => {
      onFixerDieClick?.(playerArg, indexArg, result);
    }}
  />
    );
  })}
          </div>

          {/* RIGHT: BOARD */}
          <div className="col-span-10 flex flex-col gap-2">
            {isOpponent ? (
              <>
                <div className="flex items-stretch gap-2">

    {/* LEFT: LEGENDS */}
    <LegendsRow
    legends={player.legends || []}
    borderColor={borderColor}
    onLegendClick={onLegendClick}
    onHover={setHoveredLegend}
    onLeave={() => setHoveredLegend(null)}
  />

    {/* MIDDLE: EDDIES */}
    <div className="flex flex-col items-start">

    <p
      className="text-xs font-orbitron mb-1"
      style={{ color: borderColor }}
    >
      EDDIES<span style={{ color: borderColor }}>---</span><span style={{ color: "#32c832", fontSize: "12px" }}>
     €$ {availableEddies}
  </span>
    </p>
    

    <div
      className="flex gap-1 p-1 rounded-md"
      style={{
        border: `1px dashed ${borderColor}`,
        height: "88px", // MATCH LEGENDS HEIGHT
      }}
    >
      {(player.eddies || []).length === 0 ? (
    <span className="text-xs opacity-30 m-auto">EMPTY</span>
  ) : (
    player.eddies.map((card, i) => (
    <img
      key={card.uid || i}
      src={CARD_BACK}
      className="w-14 h-20 object-cover rounded transition-all duration-200"
      style={{
        transform: card.spent ? "rotate(45deg)" : "rotate(0deg)",
        marginRight: card.spent ? "12px" : "4px",
        boxShadow: "0 0 6px rgba(0,255,255,0.25)",
      }}
    />
  ))
  )}
    </div>

  </div>

{/* RIGHT: TRASH */}
<TrashZone
  trash={player.trash || []}
  borderColor={borderColor}
/>

  </div>
                {/* 🔥 OPPONENT FIELD (attackable units) */}
  <div
    className={cn(
      "rounded-lg transition-all",
      canAttackUnits && isOpponent && "ring-2 ring-red-500 animate-pulse"
    )}
  >
    <FieldArea
  field={player.field}
  borderColor={borderColor}
  selectedAttacker={selectedAttacker}
  onFieldUnitClick={onFieldUnitClick}
  phase={phase}
/>

  {/* ✅ SINGLE GIG BOX */}
  <div
    className={cn(
    "min-h-[56px] min-w-[56px] w-fit max-w-full rounded-xl flex flex-wrap justify-center items-center gap-2 p-2 mx-auto",
      "transition-all",
      canAttackGigs && isOpponent && "ring-2 ring-red-500 animate-pulse"
    )}
    style={{ border: `2px dashed ${borderColor}` }}
  >
    {(player.gigDice || []).length === 0 ? (
      <span className="font-orbitron text-xs opacity-30">GIG AREA</span>
    ) : (
      (player.gigDice || []).map((die, i) => {
    if (!die) return null;

    return (
      <div
        key={die.id}
        onClick={() => {
          if (canAttackGigs && isOpponent) {
            onAttackGig?.(i);
          }
        }}
        className="cursor-pointer hover:scale-110 transition-transform"
      >
        <GigDice
          die={die}
          player={player}
          index={i}
        />
      </div>
    );
  })
    )}
  </div>
  </div>


              </>
            ) : (
              <>
    {/* ✅ GIG BOX FIRST */}
    <div
    className="min-h-[56px] min-w-[56px] w-fit max-w-full rounded-xl flex flex-wrap justify-center items-center gap-2 p-2 mx-auto"
      style={{ border: `2px dashed ${borderColor}` }}
    >
      {(player.gigDice || []).length === 0 ? (
        <span className="font-orbitron text-xs opacity-30">GIG AREA</span>
      ) : (
        (player.gigDice || []).map((die, i) => {
    if (!die) return null;

    return (
      <GigDice
        key={die.id}
        die={die}
        player={player}
        index={i}
      />
    );
  })
      )}
    </div>

    {/* THEN FIELD */}
    <FieldArea
  field={player.field}
  borderColor={borderColor}
  selectedAttacker={selectedAttacker}
  onFieldUnitClick={onFieldUnitClick}
  phase={phase}
/>
                <div className="flex items-start gap-2">

    {/* LEFT: LEGENDS */}
    <LegendsRow
    legends={player.legends || []}
    borderColor={borderColor}
    onLegendClick={onLegendClick}
    onHover={setHoveredLegend}
    onLeave={() => setHoveredLegend(null)}
  />

    {/* MIDDLE: EDDIES */}
    <div className="flex flex-col items-start">

    <p
      className="text-xs font-orbitron mb-1"
      style={{ color: borderColor }}
    >
      EDDIES<span style={{ color: borderColor }}>---</span><span style={{ color: "#32c832", fontSize: "12px" }}>
    €$ {availableEddies}
  </span>
    </p>

    <div
      className="flex gap-1 p-1 rounded-md"
      style={{
        border: `1px dashed ${borderColor}`,
        height: "88px", // MATCH LEGENDS HEIGHT
      }}
    >
      {(player.eddies || []).length === 0 ? (
    <span className="text-xs opacity-30 m-auto">EMPTY</span>
  ) : (
    player.eddies.map((card, i) => (
    <img
      key={card.uid || i}
      src={CARD_BACK}
      className="w-14 h-20 object-cover rounded transition-all duration-200"
      style={{
        transform: card.spent ? "rotate(45deg)" : "rotate(0deg)",
        marginRight: card.spent ? "12px" : "4px",
        boxShadow: "0 0 6px rgba(0,255,255,0.25)",
      }}
    />
  ))
  )}
    </div>

  </div>

{/* RIGHT: TRASH */}
<TrashZone
  trash={player.trash || []}
  borderColor={borderColor}
/>

  </div>
              </>
            )}
          </div>
        </div>

        {hoveredLegend && (
          <CardHoverPreview card={hoveredLegend} mousePos={mousePos} />
        )}
      </div>
    );
  } 
