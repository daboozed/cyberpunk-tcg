// cardPool.js — Card pool data and deck building utilities

const BASE_IMG = 'https://exburst.dev/cyberpunk/cards/hd/';

export const CARD_BACK = 'https://i.imgur.com/YnmxLtL.jpeg';

const TAGS = {
  CYBERWARE: 'Cyberware', CORPO: 'Corpo', STREET: 'Street', NETRUNNER: 'Netrunner',
  FIXER: 'Fixer', TECH: 'Tech', SOLO: 'Solo', MILITECH: 'Militech',
  NOMAD: 'Nomad', MERC: 'Merc', ARASAKA: 'Arasaka', DRONE: 'Drone',
  VEHICLE: 'Vehicle', LEADER: 'Leader',
};

export const LEGEND_BACK = 'https://media.base44.com/images/public/69c87055481aa236d6027cc9/27e9fdc50_generated_image.png';

export const LEGENDS_POOL = [
  { id: 'l0', name: 'Yorinobu Arasaka', subtitle: 'Embracing Destruction', type: 'legend', cost: 0, power: 0, color: 'red', tags: [TAGS.ARASAKA, TAGS.CORPO], sellable: false, effectType: 'passive', effect: 'The first time a friendly Arasaka unit attacks each turn, draw a card.', imageUrl: BASE_IMG + '69675c6c8b5e9ad6eb87a33d_a001.webp' },
  { id: 'l1', name: 'Goro Takemura', subtitle: 'Vengeful Bodyguard', type: 'legend', cost: 0, power: 0, color: 'green', tags: [TAGS.ARASAKA, TAGS.CORPO], sellable: false, effectType: 'call', effect: 'CALL: Ready this Legend. When a rival Unit attacks, you may block with this Legend.', imageUrl: BASE_IMG + 'HCa8qzjXUAEuAhg_fx_1772548504228.webp' },
  { id: 'l3', name: 'Saburo Arasaka', subtitle: 'Stubborn Patriarch', type: 'legend', cost: 0, power: 0, color: 'green', tags: [TAGS.ARASAKA, TAGS.CORPO], sellable: false, effectType: 'passive', effect: 'Passive: Your Arasaka units have +1 Power when attacking.', imageUrl: BASE_IMG + '69675c6c8b5e9ad6eb87a340_a005.webp' },
  { id: 'l4', name: 'Goro Takemura', subtitle: 'Hands Unclean', type: 'legend', cost: 5, power: 7, color: 'green', tags: [TAGS.ARASAKA, TAGS.CORPO], sellable: false, keywords: ['goSolo', 'blocker'], effectType: 'call', effect: 'GO SOLO: Pay this card\'s cost to play it as a Unit. BLOCKER.', imageUrl: BASE_IMG + '69675c6c8b5e9ad6eb87a33f_a004.webp' },
  { id: 'l6', name: 'Royce', subtitle: 'Psycho on the Edge', type: 'legend', cost: 0, power: 6, color: 'red', tags: [TAGS.STREET], sellable: false, keywords: [], effectType: 'passive', effect: 'Passive: You may spend this Legend as a Unit that costs 4 or less.', imageUrl: BASE_IMG + 'HDD70ftXMAImqYX_fx_1773159988271.webp' },
  { id: 'l7', name: 'Viktor Vektor', subtitle: 'Sit Down and Relax', type: 'legend', cost: 0, power: 0, color: 'yellow', tags: [TAGS.TECH, TAGS.FIXER], sellable: false, effectType: 'play', effect: 'PLAY: Search the top 5 cards for up to 2 Gear that cost 1. Add them to your hand.', imageUrl: BASE_IMG + '697107581860bf853828ac0d_a006.webp' },
  { id: 'l8', name: 'River Ward', subtitle: 'Detective on the Hunt', type: 'legend', cost: 0, power: 6, color: 'yellow', tags: [TAGS.SOLO], sellable: false, effectType: 'passive', effect: 'PLAY: Draw a card. When a Unit attacks, you may equip a Gear from your hand for free.', imageUrl: BASE_IMG + 'HCVzBbPWIAAVHeJ_fx_1772547846777.webp' },
  { id: 'l9', name: 'Dum Dum', subtitle: 'Maelstrom Triggerman', type: 'legend', cost: 0, power: 3, color: 'yellow', tags: [TAGS.STREET, TAGS.LEADER], sellable: false, effectType: 'passive', effect: 'PLAY: You may discard a Gear from your hand. If you do, draw 2 cards.', imageUrl: BASE_IMG + 'HC0sSXJXoAEfB1e_fx_1773100949776.webp' },
  { id: 'l10', name: 'Evelyn Parker', subtitle: 'Beautiful Enigma', type: 'legend', cost: 0, power: 0, color: 'blue', tags: [TAGS.NETRUNNER], sellable: false, effectType: 'passive', effect: 'PLAY: Decrease a rival Gig\'s value by 3. Search top 3 for a card and add it to hand.', imageUrl: BASE_IMG + 'HClP1UYW8AAhOF3_fx_1772715954148.webp' },
  { id: 'l11', name: 'Jackie Welles', subtitle: 'Pour One Out For Me', type: 'legend', cost: 0, power: 0, color: 'blue', tags: [TAGS.MERC], sellable: false, effectType: 'passive', effect: 'The first time you play a blue unit or blue program each turn, gain 1 Eddie.', imageUrl: BASE_IMG + '696fb4431860bf853822a945_a002.webp' },
  { id: 'l12', name: 'V', subtitle: 'Corporate Exile', type: 'legend', cost: 5, power: 8, color: 'blue', tags: [TAGS.MERC, TAGS.CORPO], sellable: false, keywords: ['goSolo'], effectType: 'call', effect: 'GO SOLO: Pay this card\'s cost to play it as a Unit. [TEST: Click arrow to flip]', imageUrl: BASE_IMG + '69675c6c8b5e9ad6eb87a33e_a003.webp' },
  { id: 'l13', name: 'Jackie & V', type: 'legend', cost: 0, power: 0, color: 'yellow', tags: [TAGS.MERC], sellable: false, effectType: 'passive', effect: 'Target friendly Unit gets +3 Power this turn.', imageUrl: BASE_IMG + 'N000_fx_1773105864012.webp' },
  { id: 'l14', name: 'V', subtitle: 'Streetkid', type: 'legend', cost: 4, power: 3, color: 'blue', tags: [TAGS.MERC], sellable: false, keywords: ['goSolo'], effectType: 'defeated', effect: 'GO SOLO. DEFEATED: Discard the top 3 cards of your deck. Then draw 2.', imageUrl: BASE_IMG + 'HDev-srW8AEOtTs_fx_1773657698631.webp' },
  { id: 'l15', name: 'Panam Palmer', subtitle: 'Nomad Cavalry', type: 'legend', cost: 0, power: 0, color: 'green', tags: [TAGS.NOMAD, TAGS.MERC], sellable: false, effectType: 'call', effect: 'CALL: Ready this Legend. When a friendly Unit attacks, give it +2 Power.', imageUrl: BASE_IMG + 'HDTYZqXWMAAkMUu_fx_1773472454818.webp' },
  { id: 'l16', name: 'Alt Cunningham', subtitle: 'Soulkiller Architect', type: 'legend', cost: 0, power: 4, color: 'blue', tags: [TAGS.NETRUNNER], sellable: false, keywords: ['goSolo'], effectType: 'passive', effect: 'GO SOLO. When this Legend is played as a unit, draw 2 cards.', imageUrl: BASE_IMG + 'HDZmaM4WcAAOGXs_fx_1773657875333.webp' },
];

export const UNITS_POOL = [
  { id: 'u1', name: 'Swordwise Huscle', type: 'unit', cost: 3, power: 5, color: 'red', tags: [TAGS.ARASAKA, TAGS.MERC], sellable: false, effect: null, keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac1a_a009.webp' },
  { id: 'u2', name: 'Corpo Security', type: 'unit', cost: 2, power: 2, color: 'green', tags: [TAGS.CORPO], sellable: false, cantAttack: true, effect: 'This unit can\'t attack. BLOCKER.', keywords: ['blocker', 'cantAttack'], imageUrl: BASE_IMG + '697107581860bf853828ac20_a016.webp' },
  { id: 'u3', name: 'Delamain Cab', type: 'unit', cost: 4, power: 7, color: 'blue', tags: [TAGS.VEHICLE], sellable: false, effect: null, keywords: [], imageUrl: BASE_IMG + '69675c6c8b5e9ad6eb87a341_a010.webp' },
  { id: 'u4', name: 'Jackie Welles', subtitle: 'Ride Or Die Choom', type: 'unit', cost: 6, power: 6, color: 'yellow', tags: [TAGS.MERC], sellable: false, effect: 'This unit has +2 Power for each of your friendly Gigs.', keywords: [], gigScaling: true, imageUrl: BASE_IMG + '697107581860bf853828ac1d_a013.webp' },
  { id: 'u5', name: 'Ruthless Lowlife', type: 'unit', cost: 2, power: 1, color: 'red', tags: [TAGS.STREET], sellable: false, effect: 'When a rival steals one or more of your Gigs, if this Unit is spent, the value of those Gigs becomes 1.', keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac19_a008.webp' },
  { id: 'u6', name: 'Armored Minotaur', type: 'unit', cost: 6, power: 9, color: 'red', tags: [TAGS.ARASAKA, TAGS.MILITECH, TAGS.DRONE], sellable: false, effect: 'PLAY: If you have 12+ ★, defeat a rival Unit with Power 5 or less.', keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac0e_a007.webp' },
  { id: 'u7', name: 'MT0D12 Flathead', type: 'unit', cost: 5, power: 5, color: 'blue', tags: [TAGS.MILITECH, TAGS.DRONE], sellable: false, effect: 'If you have 7+ ★, this Unit can\'t be blocked.', keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac1c_a012.webp' },
  { id: 'u8', name: 'Emergency Atlus', type: 'unit', cost: 4, power: 7, color: 'green', tags: [TAGS.VEHICLE, TAGS.CORPO], sellable: false, effect: null, keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac0f_a017.webp' },
  { id: 'u9', name: 'Goro Takemura', subtitle: 'Losing His Way', type: 'unit', cost: 4, power: 5, color: 'green', tags: [TAGS.ARASAKA, TAGS.CORPO], sellable: false, effect: 'This unit has +1 power for each face-up legend in your legends area.', keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac10_a018.webp' },
  { id: 'u10', name: 'Secondhand Bombus', type: 'unit', cost: 2, power: 2, color: 'yellow', tags: [TAGS.DRONE], sellable: false, cantAttack: true, effect: 'This unit can\'t attack. BLOCKER.', keywords: ['blocker', 'cantAttack'], imageUrl: BASE_IMG + '697107581860bf853828ac1e_a014.webp' },
  { id: 'u12', name: 'Kerry Eurodyne', subtitle: 'The Last Rockerboy', type: 'unit', cost: 4, power: 3, color: 'red', tags: [TAGS.FIXER], sellable: false, effect: 'If you have a Gig at max value, draw 2 cards.', keywords: [], imageUrl: BASE_IMG + 'HC516tFWcAETJ0B_fx_1773100806522.webp' },
  { id: 'u13', name: 'Adam Smasher', subtitle: 'Metal Over Meat', type: 'unit', cost: 9, power: 15, color: 'yellow', tags: [TAGS.ARASAKA, TAGS.MERC], sellable: false, keywords: ['goSolo'], effect: 'GO SOLO. PLAY: Defeat all other Units on the field.', imageUrl: BASE_IMG + 'HCvi-cVXsAAy_LP_1772836322595.webp' },
  { id: 'u14', name: 'Meredith Stout', subtitle: 'Stone Cold Corpo', type: 'unit', cost: 4, power: 3, color: 'red', tags: [TAGS.CORPO, TAGS.MILITECH], sellable: false, effect: 'When a rival decreases a friendly Gig value, add a card from your trash to hand.', keywords: [], imageUrl: BASE_IMG + 'HDJFPzDXIAAObwG_fx_1773265402636.webp' },
  { id: 'u15', name: 'Evelyn Parker', subtitle: 'Scheming Siren', type: 'unit', cost: 2, power: 1, color: 'blue', tags: [TAGS.NETRUNNER, TAGS.FIXER], sellable: false, effect: 'When a rival steals one or more friendly gigs, if this unit is spent, draw a card.', keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac1b_a011.webp' },
  { id: 'u16', name: 'T-Bug', subtitle: 'Amateur Philosopher', type: 'unit', cost: 3, power: 5, color: 'yellow', tags: [TAGS.NETRUNNER, TAGS.MERC], sellable: false, effect: null, keywords: [], imageUrl: BASE_IMG + '697107581860bf853828ac1f_a015.webp' },
  { id: 'u18', name: 'Hanako Arasaka', subtitle: 'In A Gilded Cage', type: 'unit', cost: 3, power: 0, color: 'yellow', tags: [TAGS.ARASAKA, TAGS.CORPO, TAGS.NETRUNNER], sellable: false, effect: 'PLAY: Reveal top 4. Add all with cost equal to a friendly Gig value to hand.', keywords: [], imageUrl: BASE_IMG + 'HDOO2F7WcAEnyN7_fx_1773472672150.webp' },
  { id: 'u19', name: 'Riding Nomad', type: 'unit', cost: 6, power: 6, color: 'green', tags: [TAGS.NOMAD], sellable: false, effect: 'GO SOLO: Can attack spent rival Units the turn it\'s played.', keywords: ['goSolo'], imageUrl: BASE_IMG + 'HC-_nJvXsAAtEov_fx_1773100562778.webp' },
];

export const PROGRAMS_POOL = [
{ id:'p1', name:'Reboot Optics', type:'program', cost:2, color:'yellow', tags:[TAGS.TECH], sellable:true, effect:'Give a friendly Unit +4 Power this turn. Defeat it at the end of the turn.', effectData:{ type:'PROGRAM_MULTI', action:['CHOOSE_FRIENDLY_UNIT','BUFF_SELECTED_UNIT_4_THIS_TURN','DEFEAT_SELECTED_UNIT_END_TURN'] }, imageUrl: BASE_IMG + '697107581860bf853828ac18_a028.webp' },
{ id:'p2', name:'Floor It', type:'program', cost:3, color:'blue', tags:[TAGS.MERC], sellable:true, effect:'Return a spent Unit with cost 4 or less to its owner\'s hand.', effectData:{ type:'PROGRAM_MULTI', action:['CHOOSE_SPENT_UNIT_MAX_4','RETURN_SELECTED_TO_HAND'] }, imageUrl: BASE_IMG + '696e62701860bf853818fd07_a023.webp' },
{ id:'p3', name:'Industrial Assembly', type:'program', cost:2, color:'red', tags:[TAGS.TECH,TAGS.ARASAKA], sellable:true, effect:'Increase a friendly Gig\'s value by 4. Then, if you have 7+ ★, draw a card.', effectData:{ type:'PROGRAM_MULTI', action:['CHOOSE_FRIENDLY_GIG','BOOST_SELECTED_GIG_4','IF_STARS_7_DRAW_1'] }, imageUrl: BASE_IMG + '697107581860bf853828ac12_a021.webp' },
{ id:'p4', name:"Afterparty at Lizzie's", type:'program', cost:2, color:'yellow', tags:[TAGS.FIXER], sellable:true, effect:'Adjust a rival Gig\'s value by up to ±2. Then, if a friendly Gig has the same value, draw a card.', effectData:{ type:'PROGRAM_MULTI', action:['CHOOSE_RIVAL_GIG','ADJUST_SELECTED_GIG_2','IF_MATCHING_FRIENDLY_GIG_DRAW_1'] }, imageUrl: BASE_IMG + 'HCgGA8VXEAApqFK_fx_1772583690573.webp' },
{ id:'p5', name:'Cyberpsychosis', type:'program', cost:2, color:'yellow', tags:[TAGS.NETRUNNER], sellable:true, effect:'Give an equipped Unit +2 Power for each equipped Gear this turn. Defeat it at end of turn.', effectData:{ type:'PROGRAM_MULTI', action:['CHOOSE_EQUIPPED_FRIENDLY_UNIT','BUFF_PER_GEAR_2_THIS_TURN','DEFEAT_SELECTED_UNIT_END_TURN'] }, imageUrl: BASE_IMG + 'b102_1773925765842.webp' },
{ id:'p7', name:'Corporate Surveillance', type:'program', cost:2, color:'green', tags:[TAGS.NETRUNNER,TAGS.CORPO], sellable:true, effect:'Spend a rival unit with cost 3 or less.', effectData:{ type:'PROGRAM_MULTI', action:['CHOOSE_RIVAL_UNIT_MAX_3','SPEND_SELECTED_UNIT'] }, imageUrl: BASE_IMG + '697107581860bf853828ac15_a025.webp' },
];

export const GEAR_POOL = [
  { id: 'g1', name: 'Mantis Blades', type: 'gear', cost: 1, color: 'red', tags: [TAGS.CYBERWARE], sellable: true, effect: 'Equipped Unit gets +2 Power.', powerBonus: 2, imageUrl: BASE_IMG + '696a701c1860bf853806f62a_a019.webp' },
  { id: 'g2', name: 'Sandevistan', type: 'gear', cost: 3, color: 'green', tags: [TAGS.CYBERWARE], sellable: true, effect: 'Equipped Unit gets +3 Power and GO SOLO.', powerBonus: 3, grantsGoSolo: true, imageUrl: BASE_IMG + '697107581860bf853828ac14_a024.webp' },
  { id: 'g3', name: 'Kiroshi Optics', type: 'gear', cost: 1, color: 'yellow', tags: [TAGS.CYBERWARE, TAGS.TECH], sellable: true, effect: 'Equipped Unit gets +1 Power. ATTACK: Look at a face-down rival Legend (your eyes only).', powerBonus: 1, attackEffect: 'kiroshiPeek', imageUrl: BASE_IMG + '697107581860bf853828ac16_a026.webp' },
  { id: 'g4', name: 'Mandibular Upgrade', type: 'gear', cost: 1, color: 'yellow', tags: [TAGS.CYBERWARE], sellable: true, effect: 'Equipped Unit gains BLOCKER.', powerBonus: 0, grantsBlocker: true, imageUrl: BASE_IMG + '697107581860bf853828ac17_a027.webp' },
  { id: 'g5', name: 'Satori', subtitle: 'Sword of Saburo', type: 'gear', cost: 2, color: 'red', tags: [TAGS.CYBERWARE, TAGS.ARASAKA], sellable: true, effect: 'Equipped Unit gets +1 Power. ATTACK: If this Unit wins a fight, draw a card.', powerBonus: 1, imageUrl: BASE_IMG + '697107581860bf853828ac11_a020.webp' },
  { id: 'g6', name: 'Dying Night', subtitle: "V's Pistol", type: 'gear', cost: 2, color: 'blue', tags: [TAGS.MILITECH], sellable: true, effect: 'Equipped Unit gets +2 Power. ATTACK: If you have 7+ ★, defeat a rival Gear that costs 2 or less.', powerBonus: 2, imageUrl: BASE_IMG + '697107581860bf853828ac13_a022.webp' },
  { id: 'g7', name: 'Gorilla Arms', type: 'gear', cost: 4, color: 'yellow', tags: [TAGS.CYBERWARE], sellable: true, effect: 'Equipped Unit gets +4 Power.', powerBonus: 4, imageUrl: BASE_IMG + 'HCqZSN9XoAAEoB3_fx_1772836719766.webp' },
];

const ALL_NON_LEGEND = [...UNITS_POOL, ...PROGRAMS_POOL, ...GEAR_POOL];

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildCustomDeck(legendIds, mainCardEntries, deckIndex = 0) {
  const ts = Date.now();
  const rawLegends = legendIds.map(id => LEGENDS_POOL.find(c => c.id === id)).filter(Boolean)
    .map((c, i) => ({ ...c, uid: `${c.id}_${deckIndex}_l${i}_${ts}`, faceUp: false, spent: false }));
  const legends = fisherYates(rawLegends);

  const mainDeckCards = [];
  mainCardEntries.forEach(({ id, count, apiData }) => {
    const source = [...UNITS_POOL, ...PROGRAMS_POOL, ...GEAR_POOL].find(c => c.id === id);
    if (!source) return;
    for (let i = 0; i < count; i++) {
      mainDeckCards.push({...source,...(apiData || {}), uid: `${source.id}_${deckIndex}_c${mainDeckCards.length}_${ts}`
});
    }
  });

  return { legends, mainDeck: mainDeckCards };
}

export const GIG_DICE = [
  { sides: 4,  label: 'd4',  color: 'from-cyan-400 to-cyan-600' },
  { sides: 6,  label: 'd6',  color: 'from-blue-400 to-blue-600' },
  { sides: 8,  label: 'd8',  color: 'from-violet-400 to-violet-600' },
  { sides: 10, label: 'd10', color: 'from-pink-400 to-pink-600' },
  { sides: 12, label: 'd12', color: 'from-orange-400 to-orange-600' },
  { sides: 20, label: 'd20', color: 'from-red-400 to-red-600' },
];

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

ALL_NON_LEGEND.forEach(card => {
  if (card.sellable === undefined) {
    card.sellable = false;
  }
});
