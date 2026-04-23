const NO_EFFECT = Object.freeze({ type: "NONE" });
const GEAR_EFFECTS = Object.freeze({
  "mantis blades": { type: "GEAR_PASSIVE", powerBonus: 2 },
  "satori": { type: "GEAR_TRIGGER", powerBonus: 1, trigger: "onAttackWinVsUnit", action: "DRAW", amount: 1 },
  "kiroshi optics": { type: "GEAR_TRIGGER", powerBonus: 1, trigger: "onAttack", action: "PEEK_FRIENDLY_FACEDOWN_LEGEND", count: 1 },
  "mandibular upgrade": { type: "GEAR_PASSIVE", keywords: ["blocker"] },
  "gorilla arms": { type: "GEAR_TRIGGER", powerBonus: 4, trigger: "firstGigStealEachTurn", action: "STEAL_MATCHING_GIG" },
  "sandevistan": { type: "GEAR_TRIGGER", powerBonus: 3, trigger: "onPlay", action: "CAN_ATTACK_SPENT_UNITS_THIS_TURN" },
  "dying night": { type: "GEAR_TRIGGER", powerBonus: 2, trigger: "onAttack", condition: "stars>=7", action: "DESTROY_RIVAL_GEAR_MAX_2" }
});
const PROGRAM_EFFECTS = Object.freeze({
  "reboot optics": { type: "PROGRAM_MULTI", action: ["BUFF_FRIENDLY_UNIT_4_THIS_TURN", "DEFEAT_TARGET_END_TURN"] },
  "floor it": { type: "RETURN_TO_HAND", target: "spent_unit", maxCost: 4 },
  "corporate surveillance": { type: "SPEND_RIVAL_UNIT_MAX_COST", maxCost: 3 },
  "industrial assembly": { type: "PROGRAM_MULTI", action: ["BOOST_FRIENDLY_GIG_4", "IF_STARS_7_DRAW_1"] },
  "afterparty at lizzie's": { type: "PROGRAM_MULTI", action: ["ADJUST_RIVAL_GIG_UP_TO_2", "IF_MATCHING_FRIENDLY_GIG_DRAW_1"] },
  "cyberpsychosis": { type: "PROGRAM_MULTI", action: ["BUFF_EQUIPPED_UNIT_PLUS2_PER_GEAR", "DEFEAT_TARGET_END_TURN"], reactivePlay: true, reactiveCost: "SPEND_FRIENDLY_UNIT_OR_FACEUP_LEGEND" }
});
const UNIT_EFFECTS = Object.freeze({
  "ruthless lowlife": { type: "UNIT_TRIGGER", trigger: "onRivalStealGig", condition: "selfSpent", action: "SET_STOLEN_GIGS_VALUE_TO_1" },
  "swordwise huscle": NO_EFFECT,
  "el sombrerón": { type: "UNIT_TRIGGER", trigger: "onAttackVsUnit", action: "DOUBLE_POWER_DURING_FIGHT" },
  "kerry eurodyne": { type: "UNIT_ACTIVATE", cost: "SPEND_SELF", condition: "friendlyGigAtMaxValue", action: "DRAW", amount: 2 },
  "meredith stout": { type: "UNIT_TRIGGER", trigger: "onFriendlyGigReduced", action: "RETURN_TRASH_CARD_TO_HAND" },
  "armored minotaur": { type: "UNIT_TRIGGER", trigger: "onPlay", condition: "streetCred>=12", target: "rivalUnitPowerMax5", action: "DEFEAT_TARGET" },
  "secondhand bombus": { type: "UNIT_PASSIVE", keywords: ["blocker"], restrictions: ["cannotAttack"] },
  "hanako arasaka": { type: "UNIT_TRIGGER", trigger: "onPlay", action: "REVEAL_TOP4_ADD_MATCHING_COST_TO_HAND_TRASH_REST" },
  "t-bug": NO_EFFECT,
  "caliber": { type: "UNIT_TRIGGER", trigger: "onDefeated", action: "RIVAL_DISCARD_1_THEN_IF_COST_MATCH_GIG_DISCARD_1" },
  "jackie welles": { type: "UNIT_PASSIVE", action: "GAIN_2_POWER_PER_FRIENDLY_GIG" },
  "adam smasher": { type: "UNIT_TRIGGER", trigger: "onPlay", action: "DEFEAT_ALL_OTHER_UNITS" },
  "corpo security": { type: "UNIT_PASSIVE", keywords: ["blocker"], restrictions: ["cannotAttack"] },
  "emergency atlus": NO_EFFECT,
  "goro takemura": { type: "UNIT_PASSIVE", condition: "duringYourTurn", action: "GAIN_1_POWER_PER_FACEUP_LEGEND" },
  "riding nomad": { type: "UNIT_PASSIVE", trigger: "onPlay", action: "CAN_ATTACK_SPENT_UNITS_THIS_TURN" },
  "evelyn parker": { type: "UNIT_TRIGGER", trigger: "onRivalStealGig", condition: "selfSpent", action: "DRAW", amount: 1 },
  "delamain cab": NO_EFFECT,
  "mt0d12 flathead": { type: "UNIT_PASSIVE", condition: "streetCred>=7", action: "CANT_BE_BLOCKED" },
  "placide": { type: "UNIT_TRIGGER", trigger: ["onPlay","onAttack"], optionalCost: "DISCARD_PROGRAM", action: "BOTTOM_DECK_RIVAL_UNIT" }
});
const LEGEND_EFFECTS = Object.freeze({
  "v-streetkid": { type: "LEGEND_TRIGGER", keywords: ["goSolo"], trigger: "onDefeated", action: "MILL_3_RETURN_BRAINDANCE_FROM_TRASH_TO_HAND" },
  "royce-psycho-on-the-edge": { type: "LEGEND_PASSIVE", keywords: ["goSolo"], condition: "duringYourTurn", action: "GAIN_2_POWER_PER_EQUIPPED_GEAR" },
  "yorinobu-arasaka-embracing-destruction": { type: "LEGEND_TRIGGER", trigger: "firstFriendlyArasakaUnitAttacksEachTurn", action: ["DRAW_1", "IF_STREETCRED_LT_20_DISCARD_1"] },
  "dum-dum-maelstrom-triggerman": { type: "LEGEND_CALL", action: ["MAY_DEFEAT_FRIENDLY_GEAR_FOR_DRAW_4", "OTHERWISE_DRAW_1"] },
  "river-ward-detective-on-the-hunt": { type: "LEGEND_MULTI", trigger: ["onCall", "whenUnitAttacksSpend"], action: ["DRAW_1", "EQUIP_GEAR_COST_2_OR_LESS_TO_FRIENDLY_YELLOW_NO_GEAR_FOR_FREE"] },
  "viktor-vektor-sit-down-and-relax": { type: "LEGEND_FLIP", action: "SEARCH_TOP5_ADD_UP_TO_2_GEAR_COST_2_OR_LESS_BOTTOM_REST_RANDOM" },
  "goro-takemura-hands-unclean": { type: "LEGEND_PASSIVE", keywords: ["goSolo", "blocker"] },
  "goro-takemura-vengeful-bodyguard": { type: "LEGEND_MULTI", trigger: ["onCall", "whenRivalUnitAttacksSpend"], action: ["READY_SELF", "IF_SIDED_PAIR_GIGS_BUFF_FRIENDLY_UNIT_COST4_OR_LESS_PLUS1_AND_BLOCKER_THIS_TURN"] },
  "panam-palmer-nomad-cavalry": { type: "LEGEND_MULTI", trigger: ["onCall", "whenFriendlyUnitAttacksSpend"], action: ["READY_SELF", "MOVE_GEAR_FROM_SELF_TO_ATTACKER_AND_READY_IT"] },
  "saburo-arasaka-stubborn-patriach": { type: "LEGEND_PASSIVE", action: "ARASAKA_UNITS_GAIN_1_POWER_WHEN_ATTACKING" },
  "v-corporate-exile": { type: "LEGEND_PASSIVE", keywords: ["goSolo"] },
  "alt-cunningham-soulkiller-architect": { type: "LEGEND_TRIGGER", keywords: ["goSolo"], trigger: "onStealGig", action: "MAY_REMOVE_SELF_PLAY_PROGRAM_FROM_TRASH_FREE" },
  "evelyn-parker-beautiful-enigma": { type: "LEGEND_MULTI", trigger: ["onCall", "spendAbility"], action: ["DECREASE_RIVAL_GIG_3", "SEARCH_TOP3_ADD_UP_TO_1_BRAINDANCE_BOTTOM_REST"] },
  "jackie-welles-pour-one-out-for-me": { type: "LEGEND_TRIGGER", trigger: "firstBlueUnitOrGearPlayedEachTurn", action: ["MAY_BOOST_FRIENDLY_GIG_2", "IF_AT_MAX_DRAW_1"] },
  "lucyna-kushinada": NO_EFFECT
});

export function adaptCard(apiCard) {
  return {
    id: apiCard.name
    ?.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, ""),

    name: apiCard.name,

    type: normalizeType(apiCard.card_type),

    cost: apiCard.cost ?? 0,
    ram: apiCard.ram ?? 0,
    power: apiCard.power ?? 0,

    sellable: isSellable(apiCard.card_type),

    text: apiCard.rules_text || "",

    effect: mapEffect(apiCard.name),
  };
}
function normalizeType(type) {
  if (!type) return "UNKNOWN";
  return type.toLowerCase();
}
function mapEffect(name = "") {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  console.log("Mapped:", n);

  if (GEAR_EFFECTS[n]) return GEAR_EFFECTS[n];
  if (PROGRAM_EFFECTS[n]) return PROGRAM_EFFECTS[n];
  if (UNIT_EFFECTS[n]) return UNIT_EFFECTS[n];
  if (LEGEND_EFFECTS[n]) return LEGEND_EFFECTS[n];

  return NO_EFFECT;
}

function isSellable(type) {
  const t = (type || "").toLowerCase();
  return (
    t === "program" ||
    t === "gear"
  );
}
