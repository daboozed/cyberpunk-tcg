import CardDetailModal from "@/components/game/CardDetailModal";
import BlockerDecisionModal from "@/components/game/BlockerDecisionModal";
import AdjustGigModal from "@/components/game/AdjustGigModal";
import GigStealModal from "@/components/game/GigStealModal";
import ChooseGigModal from "@/components/game/ChooseGigModal";
import FloorItModal from "@/components/game/FloorItModal";
import CardHoverPreview from "@/components/game/CardHoverPreview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CARD_BACK } from "@/lib/cardPool";
import { ProgramResolver } from "@/lib/programResolver";
import { PHASES, resolvePendingEffect } from "@/lib/gameEngine";

export default function GameModals(props) {
  const {
    gs,
    detailCard,
    setDetailCard,

    handleBlockerDecision,
    handleAdjustGig,
    handleGigSteal,

    handleLegendPeek,
    handleLegendPeekClose,
    peekIndex,

    pendingProgram,
    setPendingProgram,

    setGs,
    setactualIndex,

    floorItCardIndex,
    setFloorItCardIndex,
    showFloorItModal,
    setShowFloorItModal,

    hoveredViktorCard,
    setHoveredViktorCard,
    mousePos,

    isMultiplayer,
    mpSave,
  } = props;

  return (
    <>
      {/* CARD DETAIL */}
      <CardDetailModal
        card={detailCard}
        open={!!detailCard}
        onClose={() => setDetailCard(null)}
      />

      {/* BLOCKER */}
      {gs.phase === PHASES.BLOCKER_DECISION &&
        gs.pendingAttackers?.length > 0 && (
          <BlockerDecisionModal
            pendingAttack={{ attacker: gs.pendingAttackers[0] }}
            playerField={gs.player.field}
            onBlock={handleBlockerDecision}
            onAllow={() => handleBlockerDecision(null)}
          />
        )}

      {/* LEGEND PEEK */}
      {gs.pendingLegendPeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-cyan-500 rounded-xl p-6 max-w-4xl w-full mx-4">
            <h2 className="font-orbitron text-xl text-cyan-400 mb-2">
              LEGEND SCAN
            </h2>

            <p className="text-xs text-muted-foreground mb-4">
              Select one face-down Legend to inspect.
            </p>

            <div className="flex gap-4 justify-center mb-6">
  {(gs.player.legends || []).map((lg, i) => {
    if (!lg) return null;

    const alreadyFaceUp = lg.faceUp;
    const selected = peekIndex === i;

    return (
      <div
        key={lg.uid || i}
        onClick={() => {
          if (!alreadyFaceUp && peekIndex === null) {
            handleLegendPeek(i);
          }
        }}
        className={cn(
          "relative rounded-lg overflow-hidden transition-all",
          !alreadyFaceUp && peekIndex === null && "cursor-pointer hover:scale-105",
          alreadyFaceUp && "opacity-80",
          selected && "ring-2 ring-cyan-400"
        )}
      >
        <img
          src={alreadyFaceUp || selected ? lg.imageUrl : CARD_BACK}
          className="w-28 h-40 object-cover"
        />

        {alreadyFaceUp && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center text-[10px] text-cyan-300 py-1">
            REVEALED
          </div>
        )}
      </div>
    );
  })}
</div>

<Button onClick={handleLegendPeekClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ADJUST GIG */}
      {gs.showAdjustGigModal && (
        <AdjustGigModal
          rivalGigs={gs.opponent.gigDice}
          playerGigs={gs.player.gigDice}
          onAdjust={handleAdjustGig}
          onClose={() => setGs((s) => ({ ...s, showAdjustGigModal: false }))}
        />
      )}

      {/* GIG STEAL */}
      {gs.pendingGigSteal && (
        <GigStealModal
          availableGigs={gs.opponent.gigDice}
          count={
            gs.pendingGigSteal.gigsToSteal - gs.pendingGigSteal.stolen
          }
          attackerName={
            gs.player.field.find(
              (u) => u.uid === gs.pendingGigSteal.attackerUid
            )?.name || "Your Unit"
          }
          onSteal={handleGigSteal}
        />
      )}

      {/* VIKTOR SEARCH */}
      {gs.pendingLegendFlip?.type === "viktor_search" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-cyan-500 rounded-xl p-4 max-w-lg mx-4">
            <h2 className="font-orbitron text-lg text-cyan-400 mb-2">
              VIKTOR VEKTOR
            </h2>

            <p className="text-xs text-muted-foreground mb-4">
              Choose up to 2 Gear costing 2 or less.
            </p>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {(gs.pendingLegendFlip.cards || []).map((card) => {
                const valid =
                  card.type === "gear" && (card.cost || 0) <= 2;

                const selected =
                  gs.pendingLegendFlip.selected?.some(
                    (c) => c.uid === card.uid
                  );

                return (
                  <button
                    key={card.uid}
                    disabled={!valid}
                    onMouseEnter={() => setHoveredViktorCard(card)}
                    onMouseLeave={() => setHoveredViktorCard(null)}
                    className={cn(
                      "border rounded p-1 transition-all",
                      valid
                        ? "hover:scale-105 hover:border-cyan-400"
                        : "opacity-30 grayscale",
                      selected && "ring-2 ring-cyan-400"
                    )}
                    onClick={() => {
                      if (!valid) return;

                      setGs((prev) => {
                        const s = structuredClone(prev);

                        if (!s.pendingLegendFlip.selected) {
                          s.pendingLegendFlip.selected = [];
                        }

                        const exists =
                          s.pendingLegendFlip.selected.find(
                            (c) => c.uid === card.uid
                          );

                        if (exists) {
                          s.pendingLegendFlip.selected =
                            s.pendingLegendFlip.selected.filter(
                              (c) => c.uid !== card.uid
                            );
                        } else if (
                          s.pendingLegendFlip.selected.length < 2
                        ) {
                          s.pendingLegendFlip.selected.push(card);
                        }

                        return s;
                      });
                    }}
                  >
                    {card.imageUrl && <img src={card.imageUrl} />}
                  </button>
                );
              })}
            </div>

            {hoveredViktorCard && (
              <CardHoverPreview
                card={hoveredViktorCard}
                mousePos={mousePos}
              />
            )}

            <Button
              className="w-full"
              onClick={() => {
                setGs((prev) => {
                  const s = structuredClone(prev);

                  const chosen =
                    s.pendingLegendFlip.selected || [];

                  s.player.hand.push(
                    ...chosen.map((card) => ({
                      ...card,
                      uid: Math.random()
                        .toString(36)
                        .slice(2),
                    }))
                  );

                  const remaining =
                    s.pendingLegendFlip.cards.filter(
                      (c) => !chosen.includes(c)
                    );

                  remaining.sort(() => Math.random() - 0.5);
                  s.player.deck.push(...remaining);

                  delete s.pendingLegendFlip;

                  return s;
                });
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}

      {/* GENERIC TARGET */}
      {gs.awaitingTarget && (
        <ChooseGigModal
          gigs={gs.player.gigDice}
          amount={gs.pendingEffect?.amount || 1}
          title="SELECT TARGET"
          description="Choose a Gig to apply the effect."
          onChoose={(gigId) => {
            const newGs = resolvePendingEffect(gs, gigId);
            setGs(newGs);
          }}
        />
      )}
{/* PROGRAM MODALS */}

{/* INDUSTRIAL ASSEMBLY */}
{pendingProgram?.effect === "p3" && (
  <ChooseGigModal
    gigs={gs.player.gigDice}
    title="INDUSTRIAL ASSEMBLY"
    description="Choose a Gig to increase by +4."
    amount={4}
    onChoose={(gigId) => {
      const newGs = ProgramResolver.resolveProgram(gs, "p3", gigId);

      setGs(newGs);
      setPendingProgram(null);
      setactualIndex(null);

      if (isMultiplayer) mpSave(newGs);
    }}
    onClose={() => setPendingProgram(null)}
  />
)}

{/* AFTERPARTY */}
{pendingProgram?.effect === "p4" && (
  <AdjustGigModal
    rivalGigs={gs.opponent.gigDice}
    playerGigs={gs.player.gigDice}
    onAdjust={(gigIndex, adjustment) => {
      const newGs = ProgramResolver.resolveProgram(gs, "p4", {
        gigIndex,
        adjustment
      });

      setGs(newGs);
      setPendingProgram(null);

      if (isMultiplayer) mpSave(newGs);
    }}
    onClose={() => setPendingProgram(null)}
  />
)}

{/* REBOOT OPTICS */}
{pendingProgram?.effect === "p1" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className="bg-card border border-cyan-500 rounded-xl p-6 max-w-lg w-full mx-4">
      <h2 className="font-orbitron text-xl text-cyan-400 mb-2">
        REBOOT OPTICS
      </h2>

      <p className="text-xs text-muted-foreground mb-4">
        Choose a friendly Unit to gain +4 Power this turn.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {gs.player.field.map((unit) => (
          <Button
            key={unit.uid}
            onClick={() => {
              const newGs = ProgramResolver.resolveProgram(
                gs,
                "p1",
                unit.uid
              );

              const p = newGs.player;
              const card = p.hand.splice(
                pendingProgram.cardIndex,
                1
              )[0];

              p.trash.push(card);

              setGs(newGs);
              setPendingProgram(null);

              if (isMultiplayer) mpSave(newGs);
            }}
          >
            {unit.name}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setPendingProgram(null)}
      >
        Cancel
      </Button>
    </div>
  </div>
)}

{/* CYBERPSYCHOSIS */}
{pendingProgram?.effect === "p5" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className="bg-card border border-yellow-500 rounded-xl p-6 max-w-lg w-full mx-4">
      <h2 className="font-orbitron text-xl text-yellow-400 mb-2">
        CYBERPSYCHOSIS
      </h2>

      <p className="text-xs text-muted-foreground mb-4">
        Choose an equipped Unit.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {gs.player.field
          .filter((u) => (u.gear || []).length > 0)
          .map((unit) => (
            <Button
              key={unit.uid}
              onClick={() => {
                const newGs = ProgramResolver.resolveProgram(
                  gs,
                  "p5",
                  unit.uid
                );

                const p = newGs.player;
                const card = p.hand.splice(
                  pendingProgram.cardIndex,
                  1
                )[0];

                p.trash.push(card);

                setGs(newGs);
                setPendingProgram(null);

                if (isMultiplayer) mpSave(newGs);
              }}
            >
              {unit.name}
            </Button>
          ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setPendingProgram(null)}
      >
        Cancel
      </Button>
    </div>
  </div>
)}

{/* CORPORATE SURVEILLANCE */}
{pendingProgram?.effect === "p7" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className="bg-card border border-green-500 rounded-xl p-6 max-w-lg w-full mx-4">
      <h2 className="font-orbitron text-xl text-green-400 mb-2">
        CORPORATE SURVEILLANCE
      </h2>

      <p className="text-xs text-muted-foreground mb-4">
        Choose a rival Unit costing 3 or less.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {gs.opponent.field
          .filter((u) => (u.cost || 0) <= 3)
          .map((unit) => (
            <Button
              key={unit.uid}
              onClick={() => {
                const newGs = ProgramResolver.resolveProgram(
                  gs,
                  "p7",
                  unit.uid
                );

                const p = newGs.player;
                const card = p.hand.splice(
                  pendingProgram.cardIndex,
                  1
                )[0];

                p.trash.push(card);

                setGs(newGs);
                setPendingProgram(null);

                if (isMultiplayer) mpSave(newGs);
              }}
            >
              {unit.name}
            </Button>
          ))}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setPendingProgram(null)}
      >
        Cancel
      </Button>
    </div>
  </div>
)}

      {/* FLOOR IT */}
      {showFloorItModal && (
        <FloorItModal
          friendlyUnits={gs.player.field.filter(
            (u) => u.spent && (u.cost || 0) <= 4
          )}
          rivalUnits={gs.opponent.field.filter(
            (u) => u.spent && (u.cost || 0) <= 4
          )}
          onSelect={(unit) => {
            const newGs = ProgramResolver.resolveProgram(
              gs,
              "p2",
              unit.uid
            );

            const p = newGs.player;
            const card = p.hand.splice(
              floorItCardIndex,
              1
            )[0];

            p.trash.push(card);

            setGs(newGs);
            setShowFloorItModal(false);
            setFloorItCardIndex(null);
            setactualIndex(null);

            if (isMultiplayer) mpSave(newGs);
          }}
          onCancel={() => {
            setShowFloorItModal(false);
            setFloorItCardIndex(null);
          }}
        />
      )}
    </>
  );
}
