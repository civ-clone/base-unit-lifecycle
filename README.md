# base-unit-lifecycle

Building blocks for a ruleset's unit lifecycle rules. The ruleset keeps its own rules (`Created`, `Destroyed` and the
rest), with its own ids, order and numbers, and builds their criteria and effects from these functions. Each one is a
rule's criterion or effect as it is: pass it straight to `new Criterion(...)` or `new Effect(...)`. Those that need a
registry, the engine or a number take it first and return the function.

- `lib/created`: `registerUnit(unitRegistry)`, `applyVisibility`, `setMoves` (full moves) and `emitCreated(engine)`
  (`unit:created`).
- `lib/activate`: `hasMoves`, `setActive`, `isBusy`, `clearBusy`, and `hasImprovement(unitImprovementRegistry, Type)` /
  `removeImprovement(unitImprovementRegistry, Type)` for each improvement waking a unit removes.
- `lib/validateMove`: `hasMovesFor` / `spendMoves` for a step the unit has the moves for, and `shortOfMovesFor` /
  `spendShort(shortfallFactor, randomNumberGenerator)` for one it hasn't: it spends what's left and gets there by
  base-unit-action-rules' `succeedsShort`.
- `lib/impassable`: `fromLand`, `toPartnersLand(partnerOf)` and `impassable`, so routes go round a treaty partner's
  land; `partnerOf` is the ruleset's territory model.
- `lib/canStow`: `carriesDomain(Domain)` and `carriesUnit(Domain)`, one `CanStow` rule per domain a transport may be
  declared to carry, from its `Carries` traits.
- `lib/stowed`: `sleepAboard`, a unit that boards sleeps.
- `lib/halted`: `emitHalted(engine)` (`unit:halted`), a GoTo stopped next to its destination.
- `lib/unsupported`: `emitUnsupported(engine)` (`unit:unsupported`).
- `lib/defeated`: `emitAndDestroy(engine, ruleRegistry)` (`unit:defeated`, then `Destroyed`), and for a defeated
  defender's stack, `defended`, `notInCity(cityRegistry)`, `hasStack(unitRegistry)` and
  `destroyStack(unitRegistry, ruleRegistry)`.
- `lib/destroyed`: `emitDestroyed(engine)` (`unit:destroyed`); `destroyedByAnother`, `notYetDestroyed` and
  `countLoss(unitLossRegistry)` for a loss report; `deactivate`; `removeImprovements(unitImprovementRegistry)`;
  `carriesCargo(transportRegistry)` / `loseCargo(transportRegistry)`, cargo lost with its transport at sea; and
  `isAboard(transportRegistry)` / `leaveOwnTransport(transportRegistry)`, cargo destroyed on its own. Both take units
  off with `leaveTransport(transportRegistry)`, which also clears `Stowed`.
- `lib/lostAtSea`: `emitLostAtSea(engine)` (`unit:lost-at-sea`), `countLosses(unitLossRegistry, transportRegistry)`
  (the transport and its cargo; before `sink`) and `sink`.
- `lib/playerAction`: `hasActiveUnits(unitRegistry)` / `activeUnits(unitRegistry, ActiveUnit)` and
  `hasInactiveUnits(unitRegistry)` / `inactiveUnits(unitRegistry, InactiveUnit)`, waiting units last.

A library: no `main`, so it registers nothing on its own. Import what you need, for example
`@civ-clone/base-unit-lifecycle/lib/destroyed`.
