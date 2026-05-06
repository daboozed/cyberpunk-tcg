# Game.jsx Split Reference

This document exists so future ChatGPT tabs/conversations can quickly understand what `src/pages/Game.jsx` currently owns and how to split it safely.

When working on `Game.jsx`, read this file first. The goal is to reduce `Game.jsx` gradually without changing gameplay behavior accidentally.

## Current role of `Game.jsx`

`Game.jsx` is currently the main game page/controller. It is responsible for far more than rendering:

- loading cards from the card service
- initializing single-player games
- initializing and syncing multiplayer rooms through Base44
- holding the main game state `gs`
- holding local UI state such as selected attacker, selected hand card, modal state, hover state, and pending program state
- calling game engine actions such as `playCard`, `attackUnit`, `endTurn`, `resolveBlockerDecision`, etc.
- computing action-button state and phase-button labels/styles
- rendering the whole screen layout
- rendering overlays and modals
- wiring props into `PlayerArea`, `HandArea`, `GameLog`, and `GameModals`

Because of this, `Game.jsx` is a good candidate for gradual splitting.

## Important current gameplay notes

- `gs` is the main game state from `createInitialState()`.
- `pendingBlock` must be passed to the Player 1/bottom `PlayerArea`, not only the opponent/top `PlayerArea`, so eligible blockers can show gray `BLOCK` buttons.
- `PASS` should call `handleBlockerDecision(null)`.
- `END TURN` should be disabled while `gs.pendingBlock` exists.
- Do not build a full priority/stack system yet.
- Combat AP rule: higher AP wins, lower AP is trashed, equal AP trashes both units.

## Current helper functions inside `Game.jsx`

These are not really UI and can be moved out:

- `cleanGigs`
- `getOrCreatePlayerId`
- `flipState`
- `shuffle`
- `makePlayerState`

Recommended destination:

```txt
src/lib/game/gamePageUtils.js
```

Possible exports:

```js
export function getOrCreatePlayerId() {}
export function flipState(gs) {}
export function shuffle(arr) {}
export function makePlayerState(deck, owner) {}
```

If `cleanGigs` is unused, delete it instead of moving it.

## Current UI state inside `Game.jsx`

These are local screen/controller states, not core engine state:

- `actualIndex`
- `selectedAttacker`
- `detailCard`
- `hoveredViktorCard`
- `showCombatLog`
- `gearTarget`
- `showRules`
- `rolledThisTurn`
- `showAdjustGigModal`
- `mulliganPreview`
- `mousePos`
- `pendingGigBoost`
- `pendingProgram`
- `showFloorItModal`
- `floorItCardIndex`
- `peekedLegend`
- `peekIndex`

Later these can be grouped into a hook:

```txt
src/hooks/useGameUiState.js
```

Example shape:

```js
const ui = useGameUiState();
```

## Recommended split order

Split gradually. Do not move everything in one PR.

### Step 1: Extract simple presentational components

Low risk. These components should receive props and render UI only.

Recommended files:

```txt
src/components/game/GameTopBar.jsx
src/components/game/GameOverOverlay.jsx
src/components/game/WaitingForOpponentOverlay.jsx
src/components/game/MulliganOverlay.jsx
src/components/game/RulesOverlay.jsx
src/components/game/GameActionBar.jsx
```

Suggested responsibilities:

#### `GameTopBar.jsx`

Renders:

- Rules button
- Combat Log button
- Leave button

Receives:

- `showRules`
- `setShowRules`
- `setShowCombatLog`
- `handleLeaveRoom`

#### `GameOverOverlay.jsx`

Renders the victory/defeat overlay.

Receives:

- `isGameOver`
- `gs`
- `handleNewGame`
- `navigate`
- `isMultiplayer`

#### `WaitingForOpponentOverlay.jsx`

Renders multiplayer waiting overlay.

Receives:

- `isMultiplayer`
- `waitingForOpponent`
- `isGameOver`
- `myRoleRef`

#### `MulliganOverlay.jsx`

Renders the mulligan prompt and preview cards.

Receives:

- `gs`
- `isMultiplayer`
- `handleMulligan`
- `mulliganPreview`
- `setMulliganPreview`
- `mousePos`
- `setMousePos`

#### `RulesOverlay.jsx`

Renders the rules panel.

Receives:

- `showRules`
- `setShowRules`

#### `GameActionBar.jsx`

Renders:

- Attack/phase button
- PASS button
- END TURN button
- debug `+1 ALL GIGS` button

Receives:

- `actionBtn`
- `phaseButtonStyle`
- `phaseButtonLabel`
- `phaseButtonDisabled`
- `handleStartAttack`
- `gs.pendingBlock`
- `passBtn`
- `handleBlockerDecision`
- `endTurnBtn`
- `handleEndTurn`
- `handleDebugIncreaseAllGigs`

Important:

```jsx
{pendingBlock && (
  <button
    className={cn(actionBtn, passBtn)}
    onClick={() => handleBlockerDecision(null)}
  >
    PASS
  </button>
)}

<button
  className={cn(actionBtn, endTurnBtn)}
  onClick={handleEndTurn}
  disabled={!!pendingBlock}
>
  END TURN
</button>
```

### Step 2: Extract helper utilities

Move non-React helper functions out of `Game.jsx`.

Recommended file:

```txt
src/lib/game/gamePageUtils.js
```

Move:

- `getOrCreatePlayerId`
- `flipState`
- `shuffle`
- `makePlayerState`

Then import them in `Game.jsx`.

### Step 3: Extract card-loading hook

Recommended file:

```txt
src/hooks/useCardData.js
```

Move:

```js
const [cards, setCards] = useState([]);
const [cardMap, setCardMap] = useState({});

useEffect(() => {
  fetchCards().then(cards => {
    setCards(cards);
    const map = Object.fromEntries(cards.map(c => [c.name.toLowerCase(), c]));
    setCardMap(map);
  });
}, []);
```

Replace with:

```js
const { cards, cardMap } = useCardData();
```

### Step 4: Extract multiplayer hook

Recommended file:

```txt
src/hooks/useMultiplayerGame.js
```

Move multiplayer responsibilities:

- `waitingForOpponent`
- `mpSetupDone`
- player labels
- refs: `myRoleRef`, `roomEntityIdRef`, `unsubRef`
- room setup effect
- Base44 subscribe/unsubscribe
- `saveStateToRoom`
- `mpSave`
- `handleLeaveRoom` can stay in `Game.jsx` or be returned from the hook

Possible API:

```js
const multiplayer = useMultiplayerGame({
  roomId,
  isMultiplayer,
  gs,
  setGs,
  navigate,
});
```

Possible return:

```js
{
  waitingForOpponent,
  setWaitingForOpponent,
  myPlayerLabel,
  oppPlayerLabel,
  myRoleRef,
  roomEntityIdRef,
  mpSave,
  saveStateToRoom,
}
```

### Step 5: Extract ready-phase auto-advance hook

Recommended file:

```txt
src/hooks/useReadyPhaseAutoAdvance.js
```

Move:

```js
useEffect(() => {
  if (gs.phase === PHASES.READY && (!isMultiplayer || !waitingForOpponent)) {
    setRolledThisTurn(false);
    const timer = setTimeout(() => setGs(prev => readyPhase(prev)), 600);
    return () => clearTimeout(timer);
  }
}, [gs.phase, gs.turn, waitingForOpponent]);
```

### Step 6: Extract derived view state

Recommended file:

```txt
src/hooks/useGameViewState.js
```

Move derived calculations:

- `isGameOver`
- `disableActions`
- `canSell`
- `canPlay`
- `phaseButtonLabel`
- `phaseButtonDisabled`
- `phaseButtonStyle`
- `getDerivedMessage` or an equivalent `derivedMessage`

Possible API:

```js
const view = useGameViewState({
  gs,
  isMultiplayer,
  waitingForOpponent,
  gearTarget,
  selectedAttacker,
  actualIndex,
  canSell,
  canPlay,
  attackBtn,
});
```

### Step 7: Extract game action handlers

This is the riskiest and should happen after the safer splits.

Recommended file:

```txt
src/hooks/useGameActions.js
```

Eventually move handlers:

- `handleMulligan`
- `handlePickGig`
- `handleCardClick`
- `handleSellCard`
- `handlePlayCard`
- `handleCallLegend`
- `handleFieldUnitClick`
- `handleOpponentFieldClick`
- `handleAttackGig`
- `handleStartAttack`
- `handleEndTurn`
- `handleBlockerDecision`
- `handleAdjustGig`
- `handleLegendPeekClose`
- `handleGigSteal`
- `handleGigBoost`
- `handleDebugIncreaseAllGigs`
- `handleLegendPeek`
- `handleNewGame`

Possible API:

```js
const actions = useGameActions({
  gs,
  setGs,
  isMultiplayer,
  mpSave,
  pendingProgram,
  setPendingProgram,
  gearTarget,
  setGearTarget,
  selectedAttacker,
  setSelectedAttacker,
  actualIndex,
  setactualIndex,
  setRolledThisTurn,
  setDetailCard,
  setFloorItCardIndex,
  setShowFloorItModal,
  setPeekedLegend,
  setPeekIndex,
});
```

Do this only after tests pass from the earlier refactors.

### Step 8: Extract board layout

Recommended file:

```txt
src/components/game/GameBoardLayout.jsx
```

Move the main board JSX:

- Player 2 area
- Player 1 area
- hand section
- action bar
- combat log panel

This component should not own game rules. It should receive state and callbacks as props.

## Things not to split yet

Avoid moving program-specific behavior too early. `handlePlayCard` currently contains targeting behavior for several programs. It should eventually move toward engine/effect/controller code, but that is a separate gameplay refactor.

Avoid a full stack/priority system for now. The current target is only cleaner file organization.

## Cleanup opportunities

Check whether these imports are unused in `Game.jsx` after `GameModals` owns modal rendering:

- `FloorItModal`
- `CardDetailModal`
- `BlockerDecisionModal`
- `AdjustGigModal`
- `GigStealModal`
- `ChooseGigModal`
- `Swords`
- `Link`
- `CARD_BACK`
- `getUnitPower`

Also check whether these are unused:

- `cleanGigs`
- `canStartAttack`
- `getDerivedMessage`
- `cards` state, unless needed later
- `pendingGigBoost`
- `showAdjustGigModal`

Remove unused items only after confirming the app still builds.

## Safer first refactor PR

The recommended first refactor PR should do only this:

1. Add presentational components for top bar, overlays, rules panel, mulligan overlay, and action bar.
2. Move non-React helpers to `gamePageUtils.js`.
3. Remove obviously unused imports.
4. Do not change engine behavior.
5. Do not change multiplayer behavior.
6. Do not change program targeting behavior.

This should make `Game.jsx` smaller while keeping behavior stable.

## Final target shape

Long term, `Game.jsx` should become a coordinator like this:

```jsx
export default function Game() {
  const navigate = useNavigate();
  const { cards, cardMap } = useCardData();
  const [gs, setGs] = useState(() => createInitialState());
  const ui = useGameUiState();
  const multiplayer = useMultiplayerGame({ roomId, isMultiplayer, gs, setGs, navigate });
  const actions = useGameActions({ gs, setGs, ui, multiplayer });
  const view = useGameViewState({ gs, ui, multiplayer });

  return (
    <GameScreenShell>
      <GameTopBar {...} />
      <GameOverOverlay {...} />
      <WaitingForOpponentOverlay {...} />
      <MulliganOverlay {...} />
      <RulesOverlay {...} />
      <GameBoardLayout {...} />
      <GameModals {...} />
    </GameScreenShell>
  );
}
```

The page should coordinate systems, not contain every system.
