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

## Rule assemblers

For a ruleset that wants the rules themselves, each takes the ruleset's id prefix, its registries and its options, and
returns the rules with ids `<prefix>:unit/<type>/<name>`, the same names and order civ1-unit uses
(`tests/fixtures/civ1-unit-rules.json` pins them):

- `lib/lifecycleRules`: `lifecycleRules(prefix, deps, options)`, by rule type (`activate`, `canStow`, `created`,
  `defeated`, `destroyed`, `expectedMovementCost`, `halted`, `impassable`, `lostAtSea`, `playerAction`, `stowed`,
  `transferred`, `unsupported`, `validateMove`), so each list can be registered where the ruleset wants it.
- `lib/movedRules`: `movedRules(prefix, deps, options)`, the `Moved` rules: cargo, collecting, taking off, a
  `CoastBound` unit lost at sea, `AttackEndsTurn`, and a broken peace treaty.
- `lib/detonatedRules`: `detonatedRules(prefix, deps, options)`, what a nuclear detonation does to the 9 squares.
  `sparesUnits` spares a city's units (Civ1's SDI Defense); an optional `vetoes` stops a detonation altogether.
- `lib/diplomatRules`: `diplomatRules(prefix, deps)`, the embassy, investigation and leader-meeting rules.
- `lib/treatyPartner`: `treatyPartner(improvements, deps)`, a `partnerOf` for `impassable` and the treaty actions: the
  partner working an improved tile.

### For civ1-unit's adoption (R2b)

- `lifecycle.transferred` holds only `transferred/emit`: civ1-unit must register its own `transferred/start-afresh`
  rule (`START_AFRESH_RULE`) before it, as it does today.
- `HALVE_CITIES_PRIORITY` and `halveCity` now live in `lib/detonatedRules` as well as civ1-unit's `lib/nuclear`; R2b
  makes civ1-unit re-export the base ones, so there is one copy.
- The defaults reproduce civ1-unit exactly: `shortStep` and `vetoes` are for other rulesets (Civ2's short step and SDI
  Defense), and leaving them out changes nothing.

A library: no `main`, so it registers nothing on its own. Import what you need, for example
`@civ-clone/base-unit-lifecycle/lib/destroyed`.
