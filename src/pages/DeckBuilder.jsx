import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Plus, Minus, Swords, Crown, Zap, Wrench, Shuffle, Trash2, Play, Search, X, FolderOpen, Users } from "lucide-react";
import CardHoverPreview from "@/components/game/CardHoverPreview";
import LoadDeckModal from "@/components/game/LoadDeckModal";
import SaveDeckModal from "@/components/game/SaveDeckModal";
import { LEGENDS_POOL, UNITS_POOL, PROGRAMS_POOL, GEAR_POOL } from "@/lib/cardPool";

const TYPE_STYLES = {
  legend:  { icon: Crown,  accent: 'text-amber-400',  label: 'Legends' },
  unit:    { icon: Swords, accent: 'text-cyan-400',   label: 'Units' },
  program: { icon: Zap,    accent: 'text-violet-400', label: 'Programs' },
  gear:    { icon: Wrench, accent: 'text-rose-400',   label: 'Gear' },
};

// Physical card border colors
const CARD_COLORS = {
  yellow: { border: 'border-yellow-400/80', ring: 'ring-yellow-400', label: 'Yellow', text: 'text-yellow-400' },
  green:  { border: 'border-green-400/80',  ring: 'ring-green-400',  label: 'Green',  text: 'text-green-400' },
  blue:   { border: 'border-blue-400/80',   ring: 'ring-blue-400',   label: 'Blue',   text: 'text-blue-400' },
  red:    { border: 'border-red-400/80',    ring: 'ring-red-400',    label: 'Red',    text: 'text-red-400' },
};

function getCardColor(card) {
  return CARD_COLORS[card.color] || CARD_COLORS.red;
}

const MAX_COPIES = 3;
const REQUIRED_LEGENDS = 3;
const MAIN_DECK_SIZE = 27;

function saveDeckToStorage(deck) {
  localStorage.setItem('cpTCG_deck', JSON.stringify(deck));
  // Also persist to saved decks list
  const existing = JSON.parse(localStorage.getItem('cpTCG_saved_decks') || '[]');
  const idx = existing.findIndex(d => d.name === deck.name);
  const entry = { ...deck, id: deck.id || ('deck_' + Date.now()) };
  if (idx >= 0) existing[idx] = entry;
  else existing.push(entry);
  localStorage.setItem('cpTCG_saved_decks', JSON.stringify(existing));
}

export default function DeckBuilder() {
  const navigate = useNavigate();
  
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deckName, setDeckName] = useState('My Deck');
  const [legends, setLegends] = useState([]); // array of card ids
  const [mainDeck, setMainDeck] = useState([]); // array of {id, count}
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
  let cancelled = false;

  async function loadCards() {
    try {
      setLoading(true);

      const res = await fetch("https://api.netdeck.gg/api/cards/cyberpunk?limit=100&offset=0");

      if (!res.ok) {
        throw new Error(`Card API failed: ${res.status}`);
      }

      const data = await res.json();
      const apiItems = Array.isArray(data.items) ? data.items : [];

      const mappedCards = apiItems.map((card, index) => {
        const rawType = String(card.card_type || "").toLowerCase();
        const rawColor = String(card.color || "").toLowerCase();

        const type =
          rawType.includes("legend") ? "legend" :
          rawType.includes("program") ? "program" :
          rawType.includes("gear") ? "gear" :
          "unit";

        const imageUrl = card.image_url || card.source_image_url || "";
        const displayName = card.display_name || card.name || "Unknown";
        const subname = card.subname || "";

        const sourceId =
          card.external_id ||
          card.id ||
          `${displayName}-${subname}-${type}-${index}`;

        return {
          id: String(sourceId),
          deckKey: String(sourceId),
          name: card.name || "Unknown",
          displayName,
          subname,
          imageUrl,
          type,
          color:
            rawColor.includes("yellow") ? "yellow" :
            rawColor.includes("green") ? "green" :
            rawColor.includes("blue") ? "blue" :
            rawColor.includes("red") ? "red" :
            null,
        };
      });
      
      if (!cancelled) {
        setCards(mappedCards);
      }
    } catch (err) {
      console.error("[DeckBuilder] Failed to load cards:", err);

      if (!cancelled) {
        setCards([]);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadCards();

  return () => {
    cancelled = true;
  };
}, []);

  const filteredCards = useMemo(() => {
  const q = search.toLowerCase().trim();

  return cards.filter(card => {
    const matchesSearch =
      !q ||
      card.name.toLowerCase().includes(q) ||
      card.displayName.toLowerCase().includes(q) ||
      card.subname.toLowerCase().includes(q);

    const matchesFilter =
      filterType === "all" ||
      card.type === filterType ||
      card.color === filterType;

    return matchesSearch && matchesFilter;
  });
}, [cards, search, filterType]);

  const legendCount = legends.length;
  const mainDeckCount = mainDeck.reduce((s, e) => s + e.count, 0);
  const isValid = legendCount === REQUIRED_LEGENDS && mainDeckCount === MAIN_DECK_SIZE;

  const getMainCount = (id) => mainDeck.find(e => e.id === id)?.count || 0;
  const isLegendSelected = (id) => legends.includes(id);

  const toggleLegend = useCallback((id) => {
    setLegends(prev => {
      if (prev.includes(id)) return prev.filter(l => l !== id);
      if (prev.length >= REQUIRED_LEGENDS) return prev;
      return [...prev, id];
    });
  }, []);

  const addCard = useCallback((id) => {
    const count = mainDeck.find(e => e.id === id)?.count || 0;
    if (count >= MAX_COPIES) return;
    if (mainDeckCount >= MAIN_DECK_SIZE) return;
    setMainDeck(prev => {
      const existing = prev.find(e => e.id === id);
      if (existing) return prev.map(e => e.id === id ? { ...e, count: e.count + 1 } : e);
      return [...prev, { id, count: 1 }];
    });
  }, [mainDeck, mainDeckCount]);

  const removeCard = useCallback((id) => {
    setMainDeck(prev => {
      const existing = prev.find(e => e.id === id);
      if (!existing) return prev;
      if (existing.count <= 1) return prev.filter(e => e.id !== id);
      return prev.map(e => e.id === id ? { ...e, count: e.count - 1 } : e);
    });
  }, []);

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handleSaved = (savedName) => {
    setDeckName(savedName);
  };

  const handleLoadDeck = (deck) => {
    setDeckName(deck.name);
    setLegends(deck.legends || []);
    setMainDeck(deck.mainDeck || []);
  };

  const handlePlayDeck = () => {
  navigate('/game', {
    state: {
      deck: {
        name: deckName,
        legends,
        mainDeck
      }
    }
  });
};

  const handleCreateRoom = () => {
    saveDeckToStorage({ name: deckName, legends, mainDeck });
    navigate('/');
  };

  const handleRandom = () => {
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    setDeckName('');
    setLegends(shuffle(LEGENDS_POOL).slice(0, 3).map(c => c.id));
    const all = [...UNITS_POOL, ...PROGRAMS_POOL, ...GEAR_POOL];
    const shuffled = shuffle(all);
    const newDeck = [];
    let total = 0;
    for (const card of shuffled) {
      if (total >= MAIN_DECK_SIZE) break;
      const copies = Math.min(MAX_COPIES, MAIN_DECK_SIZE - total);
      const count = Math.min(copies, 1 + Math.floor(Math.random() * 2));
      newDeck.push({ id: card.id, count });
      total += count;
    }
    setMainDeck(newDeck);
  };

  const handleClear = () => {
    setDeckName('');
    setLegends([]);
    setMainDeck([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-orbitron text-lg font-bold text-primary tracking-wider">DECK BUILDER</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRandom} className="font-rajdhani text-xs gap-1 border-muted-foreground/30 text-muted-foreground">
            <Shuffle className="w-3 h-3" /> Random
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear} className="font-rajdhani text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
            <Trash2 className="w-3 h-3" /> Clear
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowLoadModal(true)} className="font-rajdhani text-xs gap-1 border-muted-foreground/40 text-muted-foreground hover:bg-muted">
            <FolderOpen className="w-3 h-3" /> Load
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave} className="font-rajdhani text-xs gap-1 border-primary/50 text-primary hover:bg-primary/10">
            Save
          </Button>
          <Button size="sm" onClick={handlePlayDeck} disabled={!isValid} className="font-rajdhani text-xs gap-1 bg-muted/40 border border-muted-foreground/30 text-muted-foreground hover:bg-muted/60">
            <Play className="w-3 h-3" /> Quick Play
          </Button>
          <Button size="sm" onClick={handleCreateRoom} disabled={!isValid} className="font-rajdhani text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <Users className="w-3 h-3" /> Lobby
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Card Browser */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + Filters */}
          <div className="px-3 pt-3 pb-2 space-y-2 flex-shrink-0">
            {/* Search + Filter row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search cards..."
                  className="w-full bg-muted/30 border border-border/40 rounded-lg pl-8 pr-8 py-2 text-sm font-rajdhani text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-sm font-rajdhani text-foreground outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="all">All Cards</option>
                <optgroup label="Card Type">
                  <option value="legend">Legend</option>
                  <option value="unit">Unit</option>
                  <option value="program">Program</option>
                  <option value="gear">Gear</option>
                </optgroup>
                <optgroup label="Card Color">
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Card grid */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2"
              onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
            >
              {loading && (
                <div className="col-span-full py-8 text-center text-muted-foreground/50 font-mono text-xs">
                  Loading cards...
                </div>
              )}

              {!loading && filteredCards.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground/50 font-mono text-xs">
                  No cards found
                </div>
              )}
              
              {filteredCards.map(card => {
                const style = TYPE_STYLES[card.type];
                const Icon = style.icon;
                const cardColor = getCardColor(card);
                const isLegend = card.type === 'legend';
                const selected = isLegend ? isLegendSelected(card.deckKey) : getMainCount(card.deckKey);
                const count = isLegend ? (isLegendSelected(card.deckKey) ? 1 : 0) : getMainCount(card.deckKey);
                const maxed = isLegend ? (isLegendSelected(card.deckKey) || legendCount >= REQUIRED_LEGENDS) : count >= MAX_COPIES;

                return (
                  <div
                    key={card.deckKey}
                    className="relative group flex flex-col"
                    onMouseEnter={() => setHoveredCard(card)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onMouseMove={e => { e.stopPropagation(); setMousePos({ x: e.clientX, y: e.clientY }); }}
                  >
                    {/* Card visual */}
                    <div
                      onClick={() => isLegend ? toggleLegend(card.deckKey) : addCard(card.deckKey)}
                      className={cn(
                        "relative rounded-lg border-2 cursor-pointer transition-all duration-150 overflow-hidden aspect-[2/3] bg-black/40",
                        cardColor.border,
                        selected && `ring-2 ${cardColor.ring}`,
                        !selected && maxed && "opacity-40 cursor-not-allowed",
                        "hover:scale-105 hover:shadow-lg hover:shadow-black/50"
                      )}
                    >
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}

                      {/* Type icon */}
                      <div className="absolute top-1 right-1">
                        <Icon className={cn("w-3 h-3 drop-shadow", style.accent)} />
                      </div>
                      
                      {/* Count badge */}
                      {count > 0 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/90 border-2 border-primary flex items-center justify-center">
                          <span className="text-primary-foreground font-orbitron text-sm font-black">{count}</span>
                        </div>
                      )}
                    </div>

                    {/* Add/Remove buttons */}
                    {!isLegend && (
                      <div className="flex gap-1 mt-1">
                        <button onClick={() => removeCard(card.deckKey)} className="flex-1 flex items-center justify-center h-5 rounded bg-muted/50 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <button onClick={() => addCard(card.deckKey)} disabled={maxed || mainDeckCount >= MAIN_DECK_SIZE} className="flex-1 flex items-center justify-center h-5 rounded bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Deck Summary */}
        <div className="w-56 flex-shrink-0 border-l border-border/30 bg-card/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border/30 flex-shrink-0">
            <input
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              className="w-full bg-transparent font-orbitron text-base font-bold text-primary outline-none border-b border-primary/30 pb-1 mb-2"
            />
            <div className="flex justify-between text-sm font-mono text-muted-foreground">
              <span>Legends: <span className={legendCount === REQUIRED_LEGENDS ? 'text-green-400' : 'text-amber-400'}>{legendCount}/{REQUIRED_LEGENDS}</span></span>
              <span>Deck: <span className={mainDeckCount === MAIN_DECK_SIZE ? 'text-green-400' : 'text-amber-400'}>{mainDeckCount}/{MAIN_DECK_SIZE}</span></span>
            </div>
            {!isValid && (
              <p className="text-xs text-amber-400/70 font-mono mt-1">
                {legendCount < REQUIRED_LEGENDS ? `Need ${REQUIRED_LEGENDS - legendCount} more legend(s). ` : ''}
                {mainDeckCount < MAIN_DECK_SIZE ? `Need ${MAIN_DECK_SIZE - mainDeckCount} more cards.` : ''}
                {mainDeckCount > MAIN_DECK_SIZE ? `${mainDeckCount - MAIN_DECK_SIZE} too many cards.` : ''}
              </p>
            )}
            {isValid && <p className="text-xs text-green-400 font-mono mt-1">✓ Deck ready to play!</p>}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {/* Legends section */}
            <div>
              <p className="text-[11px] text-amber-400 font-mono uppercase tracking-wider mb-1">Legends</p>
              {legends.length === 0 && <p className="text-[11px] text-muted-foreground/50 font-mono">None selected</p>}
              {legends.map(id => {
                const card = cards.find(c => c.deckKey === id);
                if (!card) return null;
                return (
                  <div key={id} className="flex items-center gap-1.5 py-0.5 group/item">
                    {card.imageUrl && 
                      <img
                        src={card.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-6 h-8 rounded object-cover flex-shrink-0"
                      />}
                    <span className="text-xs font-mono text-amber-300 flex-1 truncate">{card.name}</span>
                    <button onClick={() => toggleLegend(id)} className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Main deck section */}
            <div>
              <p className="text-[11px] text-cyan-400 font-mono uppercase tracking-wider mb-1">Main Deck</p>
              {mainDeck.length === 0 && <p className="text-[11px] text-muted-foreground/50 font-mono">No cards added</p>}
              {mainDeck.map(({ id, count }) => {
                const card = cards.find(c => c.deckKey === id);
                if (!card) return null;
                const style = TYPE_STYLES[card.type];
                return (
                  <div key={id} className="flex items-center gap-1.5 py-0.5 group/item">
                    {card.imageUrl && 
                      <img
                        src={card.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-6 h-8 rounded object-cover flex-shrink-0"
                      />}
                    <span className={cn("text-xs font-mono flex-1 truncate", style.accent)}>{card.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => removeCard(id)} className="text-muted-foreground hover:text-destructive transition-colors"><Minus className="w-2.5 h-2.5" /></button>
                    <span className="text-xs font-mono text-foreground w-3 text-center">{count}</span>
                      <button onClick={() => addCard(id)} disabled={count >= MAX_COPIES || mainDeckCount >= MAIN_DECK_SIZE} className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"><Plus className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <CardHoverPreview card={hoveredCard} mousePos={mousePos} />
      {showLoadModal && (
        <LoadDeckModal onClose={() => setShowLoadModal(false)} onLoad={handleLoadDeck} />
      )}
      {showSaveModal && (
        <SaveDeckModal
          deckName={deckName}
          legends={legends}
          mainDeck={mainDeck}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}