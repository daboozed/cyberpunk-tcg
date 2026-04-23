import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Swords, Shield, Zap, Crown, Wrench, ChevronRight, Target, Coins } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    title: 'WIN CONDITION',
    icon: Crown,
    color: 'text-amber-400 border-amber-500/30',
    content: [
      'Start your turn with 6 or more Gig Dice in your Gig Area to win.',
      'Collect 7 Gigs at any time for an instant win.',
      'If your rival\'s deck runs out, you win automatically.',
      'If both players run out of Fixer dice, the game enters OVERTIME — first to majority of Gigs wins instantly.',
    ]
  },
  {
    title: 'TURN STRUCTURE',
    icon: ChevronRight,
    color: 'text-cyan-400 border-cyan-500/30',
    content: [
      'READY PHASE: Draw 1 card, pick & roll a Gig Die from the Fixer Area, ready all spent cards.',
      'PLAY PHASE: Sell cards for Eddies, Call Legends, play Units/Gear/Programs from hand.',
      'ATTACK PHASE: Send ready Units to attack spent rival Units or attack your rival directly to steal Gigs.',
    ]
  },
  {
    title: 'ECONOMY (EDDIES)',
    icon: Coins,
    color: 'text-accent border-accent/30',
    content: [
      'Sell 1 card from your hand per turn (must have €$ tag) to create 1 Eddie.',
      'Spend Eddies (turn sideways) to pay card costs.',
      'Legends (face-up or face-down) can be spent as 1 Eddie each.',
      'Call a Legend by spending 2 Eddies to flip it face-up (once per turn).',
    ]
  },
  {
    title: 'CARD TYPES',
    icon: Zap,
    color: 'text-violet-400 border-violet-500/30',
    content: [
      'UNITS: Deploy to the field. Can\'t attack the turn they\'re played (unless GO SOLO). Attack rival units or rival directly.',
      'LEGENDS: Start face-down. Pay 2€$ to Call (reveal). Have powerful effects. Can be spent as Eddies.',
      'GEAR: Equip to Units for stat boosts and effects. Goes to trash with the Unit.',
      'PROGRAMS: One-time effects. Played and immediately discarded.',
    ]
  },
  {
    title: 'COMBAT',
    icon: Swords,
    color: 'text-red-400 border-red-500/30',
    content: [
      'Attack spent rival Units: Compare Power. Higher Power wins. Ties destroy both.',
      'Attack rival directly: Steal 1 Gig Die. Units with 10+ Power steal 2 Gigs.',
      'BLOCKER: A ready unit with Blocker can intercept attacks on you.',
      'After attacking, the Unit becomes spent (exhausted).',
    ]
  },
  {
    title: 'KEYWORDS',
    icon: Shield,
    color: 'text-blue-400 border-blue-500/30',
    content: [
      'BLOCKER: When rival attacks you, spend this Unit to redirect the attack to it.',
      'GO SOLO: This Unit can attack the same turn it\'s played.',
      'STREET CRED (★): The total of all your Gig Dice values. Some effects require certain Street Cred.',
    ]
  },
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(hsl(190 100% 50% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50% / 0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="font-orbitron text-2xl font-bold text-primary tracking-wider">RULES</h1>
        </div>

        {/* Setup */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5"
        >
          <h2 className="font-orbitron text-sm font-bold text-primary mb-2">GAME SETUP</h2>
          <ul className="space-y-1 text-sm font-rajdhani text-foreground/80">
            <li>• Each player has 3 face-down Legends, a shuffled deck between 40-50 cards with no more then 3 of the same card, and 6 Gig Dice in the Fixer Area (d4, d6, d8, d10, d12, d20).</li>
            <li>• Draw 6 cards. You may mulligan once (shuffle back and redraw 6).</li>
            <li>• Randomly choose who goes first. First player spends 2 of their Legends.</li>
            <li>• The d20 must always be the last die taken from the Fixer Area.</li>
          </ul>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border ${section.color} bg-card/50`}
            >
              <div className="flex items-center gap-2 mb-2">
                <section.icon className={`w-4 h-4 ${section.color.split(' ')[0]}`} />
                <h2 className={`font-orbitron text-sm font-bold ${section.color.split(' ')[0]}`}>
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-1.5">
                {section.content.map((line, j) => (
                  <li key={j} className="text-sm font-rajdhani text-foreground/75 leading-relaxed">
                    • {line}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Play button */}
        <div className="mt-8 text-center">
          <Link to="/play">
            <Button className="font-orbitron tracking-wider bg-primary/20 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8">
              <Swords className="w-4 h-4 mr-2" /> START PLAYING
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}