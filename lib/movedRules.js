"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movedRules = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Declarations_1 = require("@civ-clone/library-diplomacy/Declarations");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const AttackEndsTurn_1 = require("@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn");
const CoastBound_1 = require("@civ-clone/base-unit-trait-coast-bound/CoastBound");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const High_1 = require("@civ-clone/core-rule/Priorities/High");
const LostAtSea_1 = require("@civ-clone/core-unit-transport/Rules/LostAtSea");
const Moved_1 = require("@civ-clone/core-unit/Rules/Moved");
const NavalTransport_1 = require("@civ-clone/base-unit-type-naval-transport/NavalTransport");
const Never_1 = require("@civ-clone/core-diplomacy/Expiries/Never");
const Sleeping_1 = require("@civ-clone/base-unit-action-sleep/Rules/Sleeping");
const Stowed_1 = require("@civ-clone/base-unit-action-embark/Busy/Stowed");
const holds_1 = require("@civ-clone/library-diplomacy/lib/holds");
const core_random_1 = require("@civ-clone/core-random");
/**
 * A ruleset's `Moved` rules, in order, with ids `<prefix>:unit/moved/<name>` as civ1-unit's are: telling the client,
 * vision, ending a unit's moves, transports carrying and collecting their cargo, leaving a transport, a `CoastBound`
 * unit lost at sea, an `AttackEndsTurn` unit's turn ending, and a broken peace treaty.
 */
const movedRules = (prefix, { cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, interactionRegistry = InteractionRegistry_1.instance, randomNumberGenerator = core_random_1.instance, ruleRegistry = RuleRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, }, { Move, Disembark, attacks, noVendetta, coastBoundLoss }) => {
    const id = (name) => `${prefix}:unit/moved/${name}`, 
    // Stows each of `units` aboard `transport`, as `Embark` and `LandAircraft` do, until it is full.
    collect = (transport, units) => units.forEach((unit) => {
        if (!transport.hasCapacity() || !transport.canStow(unit)) {
            return;
        }
        transport.stow(unit, unit.tile());
        unit.setBusy(new Stowed_1.default());
    }), 
    // The transport's own units on the tile it has just moved onto, that aren't already aboard something.
    unitsToCollect = (transport, tile = transport.tile()) => unitRegistry
        .getByTile(tile)
        .filter((unit) => unit !== transport &&
        unit.player() === transport.player() &&
        !transportRegistry.hasUnit(unit)), 
    // A transport's own move that took it onto a new tile (not one it was carried along on, and not an attack).
    transportMoved = [
        new Criterion_1.default((unit) => unit instanceof NavalTransport_1.default),
        new Criterion_1.default((unit, action) => action instanceof Move),
        new Criterion_1.default((unit, action) => action.to() === unit.tile()),
    ], isOwnCity = (unit) => { var _a; return ((_a = cityRegistry.getByTile(unit.tile())) === null || _a === void 0 ? void 0 : _a.player()) === unit.player(); };
    return [
        new Moved_1.default(id('emit'), new Effect_1.default((unit, action) => {
            engine.emit('unit:moved', unit, action);
        })),
        new Moved_1.default(id('apply-visibility'), new Effect_1.default((unit) => unit.applyVisibility())),
        new Moved_1.default(id('end-moves-when-exhausted'), new Criterion_1.default((unit) => unit.moves().value() < 0.3), new Effect_1.default((unit) => {
            unit.moves().set(0);
            unit.setActive(false);
        })),
        new Moved_1.default(
        // A transport leaving one of its player's cities takes only the units sentried aboard (`Stowed` or `Sleeping`);
        //  at sea, all of its cargo goes with it, and so does an aircraft aboard, awake or not.
        id('move-cargo'), new Criterion_1.default((unit) => unit instanceof NavalTransport_1.default), new Criterion_1.default((unit, action) => action instanceof Move), new Criterion_1.default((unit) => unit.hasCargo()), new Effect_1.default((unit, action) => {
            var _a;
            const transport = unit, leftPort = ((_a = cityRegistry.getByTile(action.from())) === null || _a === void 0 ? void 0 : _a.player()) === unit.player();
            transport.cargo().forEach((cargo) => {
                if (leftPort &&
                    !(cargo instanceof Air_1.default) &&
                    !(cargo.busy() instanceof Stowed_1.default) &&
                    !(cargo.busy() instanceof Sleeping_1.default)) {
                    transport.unload(cargo);
                    return;
                }
                cargo.action(action.forUnit(cargo));
            });
        })),
        // These two come after `move-cargo`, so a unit collected here isn't also sent along the move just made.
        new Moved_1.default(
        // A carrier that moves onto its player's aircraft outside a city picks them up.
        id('collect-aircraft'), ...transportMoved, new Criterion_1.default((unit) => !isOwnCity(unit)), new Effect_1.default((unit) => collect(unit, unitsToCollect(unit).filter((tileUnit) => tileUnit instanceof Air_1.default)))),
        new Moved_1.default(
        // A transport that moves into one of its player's cities picks up the units sleeping there.
        id('collect-sleeping'), ...transportMoved, new Criterion_1.default((unit) => isOwnCity(unit)), new Effect_1.default((unit) => collect(unit, unitsToCollect(unit).filter((tileUnit) => tileUnit.busy() instanceof Sleeping_1.default)))),
        new Moved_1.default(id('disembark'), new Criterion_1.default((unit, action) => action instanceof Disembark), new Effect_1.default((unit) => {
            const manifest = transportRegistry.getByUnit(unit);
            manifest.transport().unload(unit);
            transportRegistry.unregister(manifest);
        })),
        new Moved_1.default(
        // A unit that leaves its transport's tile with a plain move (an aircraft taking off, a unit walking off a ship in
        //  a city) is no longer aboard. A `Disembark` is a move too, which `disembark` unloads.
        id('take-off'), new Criterion_1.default((unit, action) => action instanceof Move), new Criterion_1.default((unit, action) => !(action instanceof Disembark)), new Criterion_1.default((unit) => transportRegistry.hasUnit(unit)), new Criterion_1.default((unit) => transportRegistry.getByUnit(unit).transport().tile() !== unit.tile()), new Effect_1.default((unit) => {
            transportRegistry.getByUnit(unit).transport().unload(unit);
            if (unit.busy() instanceof Stowed_1.default) {
                unit.setBusy();
            }
        })),
        new Moved_1.default(id('trireme-lost-at-sea'), new Criterion_1.default((unit) => unit.hasTrait(CoastBound_1.default)), new Criterion_1.default((unit) => unit.moves().value() === 0), new Criterion_1.default((unit) => !unit.tile().isCoast()), new Criterion_1.default(() => randomNumberGenerator() <= coastBoundLoss), new Effect_1.default((unit) => {
            ruleRegistry.process(LostAtSea_1.default, unit);
        })),
        new Moved_1.default(
        // A unit that `AttackEndsTurn` can't attack again until next turn.
        id('bomber/end-turn-after-attack'), new High_1.default(), new Criterion_1.default((unit) => unit.hasTrait(AttackEndsTurn_1.default)), new Criterion_1.default((unit, action) => attacks.some((AttackType) => action instanceof AttackType)), new Effect_1.default((unit) => {
            unit.moves().set(0);
            unit.setActive(false);
        })),
        new Moved_1.default(id('break-peace-treaty'), 
        // Any action with an enemy: a sneak attack or capture, or a covert action at peace.
        new Criterion_1.default((unit, action) => typeof action.enemy === 'function'), new Effect_1.default((unit, action) => {
            const enemy = action.enemy(), peaceTreaties = interactionRegistry
                .getByPlayers(unit.player(), enemy)
                .filter((interaction) => interaction instanceof Declarations_1.Peace && interaction.active());
            peaceTreaties.forEach((peaceTreaty) => peaceTreaty.expire(unit.player()));
            // The victim of an attack in peacetime holds a grudge; walking onto or pillaging its land only ends the treaty.
            if (peaceTreaties.length > 0 &&
                !noVendetta.some((ActionType) => action instanceof ActionType) &&
                !(0, holds_1.hasVendetta)(enemy, unit.player(), interactionRegistry)) {
                interactionRegistry.register(new Declarations_1.Vendetta(enemy, unit.player(), new Never_1.default(), ruleRegistry));
            }
        })),
    ];
};
exports.movedRules = movedRules;
exports.default = exports.movedRules;
//# sourceMappingURL=movedRules.js.map