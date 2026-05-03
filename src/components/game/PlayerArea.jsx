  import { useState } from "react";
  import UnitWithGear from "./UnitWithGear";
  import GigDice from "./GigDice";
  import { getAvailableEddies, getAvailableLegendEddies } from "@/lib/engine/EconomyEngine";
  import { LEGEND_BACK, CARD_BACK } from "@/lib/cardPool";
  import CardHoverPreview from "./CardHoverPreview";
  import { cn } from "@/lib/utils";
  import { PHASES } from "@/lib/engine/gameEngine";

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
          />
        ) : (
          <span className="text-[12px] opacity-30">EMPTY</span>
        )}
      </div>
    </div>
  );
}

function DeckZone({ deck = [], borderColor }) {
  return (
    <div className="flex flex-col items-start">
      <p
        className="text-xs font-orbitron mb-1"
        style={{ color: borderColor }}
      >
        DECK ({deck.length})
      </p>

      <div
        className="rounded-md p-1 flex items-center justify-center"
        style={{
          width: "56px",
          height: "88px",
          border: `1px dashed ${borderColor}`,
        }}
      >
        {deck.length > 0 ? (
          <img
            src={CARD_BACK}
            className="w-14 h-20 object-cover rounded"
          />
        ) : (
          <span className="text-[12px] opacity-30">EMPTY</span>
        )}
      </div>
    </div>
  );
}

    function FieldArea({ field, borderColor, selectedAttacker, onFieldUnitClick, phase }) {
    const isAttackPhase = phase === PHASES.ATTACK;

    return (
      <div
          className={cn("w-full max-w-[500px] flex flex-wrap justify-start gap-2 p-2 rounded-lg transition-all",
          selectedAttacker && "ring-2 ring-red-500 animate-pulse"
  )}
        style={{ border: `1px dashed ${borderColor}`, minHeight: "100px" }}
      >
        {(field || []).length === 0 ? (
  <div
    className="w-full flex items-center justify-center text-sm tracking-[4px] font-orbitron opacity-30"
    style={{ minHeight: "96px", color: borderColor }}
  >
    FIELD AREA
  </div>
) : (
  (field || []).map((unit) => {
    if (!unit) return null;

    const canAttack =
      isAttackPhase &&
      !unit.spent &&
      !unit.justPlayed &&
      !unit.cantAttack;

    return (
      <div key={unit.uid} className="relative flex flex-col items-center">

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
  })
)}
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
      onRollGig,
      onAttackGig,
      rolledThisTurn = false,
    }) {
      
    // HOOKS FIRST (must always be first)
    const [hoveredLegend, setHoveredLegend] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    // THEN derived values
    const availableEddies =
      getAvailableEddies(player) +
      getAvailableLegendEddies(player);
    
  const streetCred = player.streetCred || 0;

    const isAttackPhase = phase === PHASES.ATTACK;
    const hasAttacker = !!selectedAttacker;

    const hasUnitTargets =
  (player.field || []).some(u => u && u.spent);

const hasGigTargets =
  (player.gigDice || []).length > 0;

const canAttackUnits =
  isAttackPhase &&
  hasAttacker &&
  (hasUnitTargets || hasGigTargets);
    
    const borderColor =
      isOpponent ? "#ff3366" : "#00ffff";

      /* MOVE BOTH GIG POOLS TOGETHER */
const gigPoolX = "33px";
const gigPoolY = "55px";

const fieldX = "0px";
const fieldY = "0px";

/* MOVE BOTH DECK AREAS */
const deckX = "520px";
const deckY = "55px";

/* MOVE BOTH TRASH AREAS */
const trashX = "0px";
const trashY = "0px";

      const unlockedD20 =
  (player.gigDice || []).some(g => g.sides === 4) &&
  (player.gigDice || []).some(g => g.sides === 6) &&
  (player.gigDice || []).some(g => g.sides === 8) &&
  (player.gigDice || []).some(g => g.sides === 10) &&
  (player.gigDice || []).some(g => g.sides === 12);

          //PLAYER BOARD
      return (
  <div
  onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
  className="mx-auto rounded-lg p-2 relative overflow-visible"
  style={{
    width: "1050px",
    minHeight: "310px",

    border: "none",              // remove cyan/red border
    background: "transparent",   // remove board color
    boxShadow: "none",
  }}
>

    {/* BOARD BACKGROUND IMAGE */}
    <img
  src={isOpponent ? "/p2board.png" : "/p3board.png"}
  alt=""
  style={{
    position: "absolute",

    top: "0px",      // move BOTH boards up/down
    left: "0px",     // move BOTH boards left/right

    width: "100%",
    height: "114%",

    objectFit: "fill",
    zIndex: 0,
    pointerEvents: "none",
  }}
/>

    {/* CONTENT LAYER */}
    <div
  style={{
    position: "relative",
    zIndex: 2,
    background: "rgba(0,0,0,0.15)"
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

    {/* PLAYER 1 DICE POOL */}
<div className="col-span-1 flex flex-col gap-3">

  <div
  
>
    
    <div
  className="grid grid-cols-1 justify-items-center"
  style={{
  columnGap: "6px",
  rowGap: "1px",
  width: "74px",

  position: "relative",
  top: "49px",
  left: "62px",
}}
>
  {(player.fixerArea || []).map((die, i) => {
    const isD20 = die.sides === 20;
    const locked = rolledThisTurn || (isD20 && !unlockedD20);

      return (
      <button
        key={die.id || i}
        type="button"
        disabled={locked}
        onClick={() =>
          !locked &&
          onRollGig?.(
            isOpponent ? "opponent" : "player",
            i
          )
        }
        title={
          rolledThisTurn
            ? "Already rolled this turn"
            : isD20 && !unlockedD20
            ? "Roll all other gigs first"
            : ""
        }
        
        className="
                  w-8 h-8
                  border-2 border-yellow-300
                  bg-black
                  text-yellow-200
                  rounded-lg
                  text-lg
                  shadow-[0_0_8px_rgba(253,224,71,.35)]
                  hover:scale-105
                  hover:shadow-[0_0_12px_rgba(253,224,71,.55)]
                  transition-all duration-1
                  "
        
      >
        d{die.sides}
      </button>
    );
  })}
</div>
  </div>

</div>

    {/* RIGHT: BOARD */}
    <div className="col-span-10 flex flex-col gap-2">
      
              {isOpponent ? (
                <>
                  <div className="flex items-stretch gap-2">

      {/* PLAYER 2: LEGENDS BOX */}
      <div
          style={{
            position: "RELATIVE",
            top: "-35px",     // up / down
            left: "170px",    // left / right
  }}
>
  <LegendsRow
    legends={player.legends || []}
    borderColor={borderColor}
    onLegendClick={onLegendClick}
    onHover={setHoveredLegend}
    onLeave={() => setHoveredLegend(null)}
  />
</div>

      {/* MIDDLE: EDDIES */}
      <div
  className="flex flex-col items-start"
  style={{
    position: "relative",
    top: "-40px",
    left: "256px",
  }}
>

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
          height: "88px", 
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

{/* PLAYER 2 DECK BOX */}
<div
  style={{
    position: "relative",
    top: `calc(3px + ${deckY})`,
    left: `calc(32px + ${deckX})`,
  }}
>
  <DeckZone
    deck={player.deck || []}
    borderColor={borderColor}
  />
</div>

{/* PLAYER 2 trash */}

<div
  style={{
    position: "relative",
    top: `calc(210px + ${trashY})`,
    left: `calc(487px + ${trashX})`,
  }}
>
  <TrashZone
    trash={player.trash || []}
    borderColor={borderColor}
  />
</div>

    </div>
                  {/* PLAYER 2 FIELD AREA BOX */}
    <div className="rounded-lg transition-all">
<div
  style={{
    position: "relative",
    top: "-35px",     // move up/down
    left: "110px",    // move left/right
  }}
>
  <FieldArea
    field={player.field}
    borderColor={borderColor}
    selectedAttacker={selectedAttacker}
    onFieldUnitClick={onFieldUnitClick}
    phase={phase}
  />
</div>

                    {/* 🔥 PLAYER 2 GIG AREA BOX */}

<div
  style={{
    position: "relative",
    top: "25px", // GIG AREA UP AND DOWN
    left: "-300px", // GIG AREA LEFT AND RIGHT
  }}
>
  <GigArea
  gigs={player.gigDice || []}
  title="GIG AREA"
  clickable={isAttackPhase && !!selectedAttacker}
  onGigClick={(gigIndex) => onAttackGig?.(gigIndex)}
/>
</div>
    
    </div>


                </>
              ) : (
                <>
      
                        {/* 🔥 PLAYER 1 GIG AREA */}

      <div
  style={{
    position: "relative",
    top: "-35px", // GIG AREA UP AND DOWN
    left: "-290px", // GIG AREA LEFT AND RIGHT
  }}
>
  <GigArea
    gigs={player.gigDice || []}
    title="GIG AREA"
    clickable={false}
  />
</div>

      {/* PLAYER 1 FIELD AREA */}
<div
  style={{
    position: "relative",
    top: "-25px",   // move up/down
    left: "100px",   // move left/right
  }}
>
  <FieldArea
    field={player.field}
    borderColor={borderColor}
    selectedAttacker={selectedAttacker}
    onFieldUnitClick={onFieldUnitClick}
    phase={phase}
  />
</div>
                  <div className="flex items-start gap-3">

      {/* PLAYER 1 LEGENDS BOX */}
      <div
          style={{
          position: "relative",
          top: "40px",     // up / down
          left: "160px",    // left / right
  }}
>
      <LegendsRow
          legends={player.legends || []}
          borderColor={borderColor}
          onLegendClick={onLegendClick}
          onHover={setHoveredLegend}
          onLeave={() => setHoveredLegend(null)}
  />
</div>

      {/* PLAYER 1 EDDIES BOX */}
      <div
  className="flex flex-col items-start"
  style={{
    position: "relative",
    top: "35px",     // move up/down
    left: "250px",    // move left/right
  }}
>

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
          height: "88px", 
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

{/* PLAYER 1 DECK BOX */}
<div
  style={{
    position: "relative",
    top: `calc(-216px + ${deckY})`,
    left: `calc(23px + ${deckX})`,
  }}
>
  <DeckZone
    deck={player.deck || []}
    borderColor={borderColor}
  />
</div>

  {/* PLAYER 1 TRASH BOX */}
<div
  style={{
    position: "relative",
    top: `calc(-22px + ${trashY})`,
    left: `calc(475px + ${trashX})`,
  }}
>


  
  <TrashZone
    trash={player.trash || []}
    borderColor={borderColor}
  />


  
</div>

    </div>
                </>
              )}
            </div>
          </div>

          {hoveredLegend && (
            <CardHoverPreview card={hoveredLegend} mousePos={mousePos} />
          )}

        </div>
      </div>
  
      );
    } 
