export function getAvailableEddies(player) {
  return (player.eddies || []).filter(e => !e.spent).length;
}
f
export function getAvailableLegendEddies(player) {
  return (player.legends || []).filter(
    l => !l.spent && !l.goSoloActive
  ).length;
}

export function spendEddies(player, amount) {
  let remaining = amount;

  (player.eddies || []).forEach(e => {
    if (!e.spent && remaining > 0) {
      e.spent = true;
      remaining--;
    }
  });

  (player.legends || []).forEach(l => {
    if (!l.spent && !l.goSoloActive && remaining > 0) {
      l.spent = true;
      remaining--;
    }
  });
}

export function getUnitPower(unit) {
  return unit?.power || 0;
}

export function calcPower(unit) {
  return (
    (unit.power || 0) +
    (unit.powerBonus || 0) +
    (unit.gear || []).reduce(
      (sum, g) => sum + (g.powerBonus || 0),
      0
    )
  );
}

