// Quick test to verify ProgramResolver works
import { ProgramResolver } from './programResolver';

export function testProgramEffects() {
  console.log('=== PROGRAM RESOLVER TEST ===');

  // Mock game state
  const mockState = {
    player: {
      hand: [],
      field: [
        { uid: 'u1', name: 'Test Unit', power: 5, powerBonus: 0, spent: false, gear: [{ powerBonus: 2 }] },
      ],
      eddies: [{ spent: false }, { spent: false }],
      gigDice: [{ id: 'g1', value: 3, sides: 6 }],
      deck: [{ id: 'c1' }, { id: 'c2' }],
      trash: [],
    },
    opponent: {
      field: [
        { uid: 'u2', name: 'Opp Unit', power: 3, cost: 2, spent: false },
      ],
      gigDice: [{ id: 'g2', value: 5, sides: 6 }],
      hand: [{ id: 'c3' }],
    },
  };

  // Test p1: Reboot Optics (buff + schedule defeat)
  console.log('\n--- p1: Reboot Optics ---');
  let state = JSON.parse(JSON.stringify(mockState));
  const result1 = ProgramResolver.resolveProgram(state, 'p1', 'u1');
  console.log('Unit powerBonus:', result1.player.field[0].powerBonus, '(expect: 4)');
  console.log('Unit scheduledDefeat:', result1.player.field[0].scheduledDefeat, '(expect: "endOfTurn")');

  // Test p2: Floor It (return spent unit)
  console.log('\n--- p2: Floor It ---');
  state = JSON.parse(JSON.stringify(mockState));
  state.opponent.field[0].spent = true;
  const result2 = ProgramResolver.resolveProgram(state, 'p2');
  console.log('Opponent field units:', result2.opponent.field.length, '(expect: 0)');
  console.log('Opponent hand units:', result2.opponent.hand.length, '(expect: 2)');

  // Test p3: Industrial Assembly (gig adjust + conditional draw)
  console.log('\n--- p3: Industrial Assembly ---');
  state = JSON.parse(JSON.stringify(mockState));
  const result3 = ProgramResolver.resolveProgram(state, 'p3', 'g1');
  console.log('Gig value:', result3.player.gigDice[0].value, '(expect: 7)');
  console.log('Player street cred:', result3.player.gigDice.reduce((s, g) => s + (g.value || 0), 0), '(expect: 7)');
  console.log('Hand size after draw:', result3.player.hand.length, '(expect: 1 if conditional fired)');

  // Test p5: Cyberpsychosis (scaling buff)
  console.log('\n--- p5: Cyberpsychosis ---');
  state = JSON.parse(JSON.stringify(mockState));
  const result5 = ProgramResolver.resolveProgram(state, 'p5', 'u1');
  console.log('Unit powerBonus:', result5.player.field[0].powerBonus, '(expect: 2 = 2*1 gear)');
  console.log('Unit scheduledDefeat:', result5.player.field[0].scheduledDefeat, '(expect: "endOfTurn")');

  // Test p7: Corporate Surveillance (spend unit)
  console.log('\n--- p7: Corporate Surveillance ---');
  state = JSON.parse(JSON.stringify(mockState));
  const result7 = ProgramResolver.resolveProgram(state, 'p7', 'u2');
  console.log('Unit spent:', result7.opponent.field[0].spent, '(expect: true)');

  console.log('\n=== TESTS COMPLETE ===');
}