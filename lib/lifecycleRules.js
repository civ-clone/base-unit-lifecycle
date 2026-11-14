"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lifecycleRules = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const UnitLossRegistry_1 = require("@civ-clone/core-unit/UnitLossRegistry");
const playerAction_1 = require("./playerAction");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const created_1 = require("./created");
const destroyed_1 = require("./destroyed");
const canStow_1 = require("./canStow");
const activate_1 = require("./activate");
const lostAtSea_1 = require("./lostAtSea");
const defeated_1 = require("./defeated");
const impassable_1 = require("./impassable");
const validateMove_1 = require("./validateMove");
const Action_1 = require("@civ-clone/core-player/Rules/Action");
const Activate_1 = require("@civ-clone/core-unit/Rules/Activate");
const CanStow_1 = require("@civ-clone/core-unit-transport/Rules/CanStow");
const Created_1 = require("@civ-clone/core-unit/Rules/Created");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Destroyed_1 = require("@civ-clone/core-unit/Rules/Destroyed");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const ExpectedMovementCost_1 = require("@civ-clone/core-world-path/Rules/ExpectedMovementCost");
const Halted_1 = require("@civ-clone/base-unit-action-goto/Rules/Halted");
const Impassable_1 = require("@civ-clone/core-world-path/Rules/Impassable");
const LostAtSea_1 = require("@civ-clone/core-unit-transport/Rules/LostAtSea");
const Stowed_1 = require("@civ-clone/core-unit-transport/Rules/Stowed");
const Transferred_1 = require("@civ-clone/core-unit/Rules/Transferred");
const Unsupported_1 = require("@civ-clone/core-unit/Rules/Unsupported");
const ValidateMove_1 = require("@civ-clone/core-unit/Rules/ValidateMove");
const halted_1 = require("./halted");
const unsupported_1 = require("./unsupported");
const moveShortfall_1 = require("@civ-clone/base-unit-action-rules/lib/moveShortfall");
const core_random_1 = require("@civ-clone/core-random");
const stowed_1 = require("./stowed");
/**
 * A ruleset's unit lifecycle rules, by the rule type they are, in the order each type's rules run. Their ids are
 * `<prefix>:unit/<type>/<name>` (`<prefix>:player/action/<name>` for the player actions), as civ1-unit's are, so a
 * ruleset registers each list where it wants it and keeps the ids another package may name.
 */
const lifecycleRules = (prefix, { cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, randomNumberGenerator = core_random_1.instance, ruleRegistry = RuleRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, unitLossRegistry = UnitLossRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, }, { ActiveUnit, InactiveUnit, removedOnActivate, stowable, partnerOf, shortfallFactor, shortStep, }) => {
    const id = (name) => `${prefix}:unit/${name}`;
    return {
        activate: [
            new Activate_1.default(id('activate/has-moves'), new Criterion_1.default(activate_1.hasMoves), new Effect_1.default(activate_1.setActive)),
            new Activate_1.default(id('activate/clear-busy'), new Criterion_1.default(activate_1.isBusy), new Effect_1.default(activate_1.clearBusy)),
            ...removedOnActivate.map((UnitImprovementType) => new Activate_1.default(id(`activate/remove-improvement/${UnitImprovementType.name}`), new Criterion_1.default((0, activate_1.hasImprovement)(unitImprovementRegistry, UnitImprovementType)), new Effect_1.default((0, activate_1.removeImprovement)(unitImprovementRegistry, UnitImprovementType)))),
        ],
        canStow: stowable.map((StowableUnitType) => new CanStow_1.default(id(`can-stow/${StowableUnitType.name}`), new Criterion_1.default((0, canStow_1.carriesDomain)(StowableUnitType)), new Effect_1.default((0, canStow_1.carriesUnit)(StowableUnitType)))),
        created: [
            new Created_1.default(id('created/register'), new Effect_1.default((0, created_1.registerUnit)(unitRegistry))),
            new Created_1.default(id('created/apply-visibility'), new Effect_1.default(created_1.applyVisibility)),
            new Created_1.default(id('created/set-moves'), new Effect_1.default(created_1.setMoves)),
            new Created_1.default(id('created/emit'), new Effect_1.default((0, created_1.emitCreated)(engine))),
        ],
        defeated: [
            new Defeated_1.default(id('defeated/emit-and-destroy'), new Effect_1.default((0, defeated_1.emitAndDestroy)(engine, ruleRegistry))),
            new Defeated_1.default(
            // `Attack` processes `Defeated` for a losing attacker too; only a defeated defender takes its stack with it.
            id('defeated/destroy-stack'), new Criterion_1.default(defeated_1.defended), new Criterion_1.default((0, defeated_1.notInCity)(cityRegistry)), new Criterion_1.default((0, defeated_1.hasStack)(unitRegistry)), new Effect_1.default((0, defeated_1.destroyStack)(unitRegistry, ruleRegistry))),
        ],
        destroyed: [
            new Destroyed_1.default(id('destroyed/emit'), new Effect_1.default((0, destroyed_1.emitDestroyed)(engine))),
            new Destroyed_1.default(
            // A loss, once, for a unit another player destroyed.
            id('destroyed/count-loss'), new Criterion_1.default(destroyed_1.destroyedByAnother), new Criterion_1.default(destroyed_1.notYetDestroyed), new Effect_1.default((0, destroyed_1.countLoss)(unitLossRegistry))),
            new Destroyed_1.default(id('destroyed/deactivate'), new Effect_1.default(destroyed_1.deactivate)),
            new Destroyed_1.default(id('destroyed/remove-improvements'), new Effect_1.default((0, destroyed_1.removeImprovements)(unitImprovementRegistry))),
            new Destroyed_1.default(id('destroyed/lose-cargo'), new Criterion_1.default((0, destroyed_1.carriesCargo)(transportRegistry)), new Effect_1.default((0, destroyed_1.loseCargo)(transportRegistry))),
            new Destroyed_1.default(id('destroyed/leave-transport'), new Criterion_1.default((0, destroyed_1.isAboard)(transportRegistry)), new Effect_1.default((0, destroyed_1.leaveOwnTransport)(transportRegistry))),
        ],
        expectedMovementCost: [
            new ExpectedMovementCost_1.default(
            // A step costing more than the unit's full moves is worth `max(m, c × shortfallFactor)` on average.
            id('expected-movement-cost/shortfall'), new Criterion_1.default((unit, movementCost, movement) => movement > 0), new Effect_1.default((unit, movementCost, movement) => shortStep === undefined
                ? (0, moveShortfall_1.expectedCost)(movement, movementCost, shortfallFactor)
                : shortStep.expectedCost(movement, movementCost))),
        ],
        halted: [new Halted_1.default(id('halted/emit'), new Effect_1.default((0, halted_1.emitHalted)(engine)))],
        impassable: partnerOf === undefined
            ? []
            : [
                new Impassable_1.default(
                // Routes go round a treaty partner's land, so following one never breaks a treaty by accident.
                id('impassable/treaty-partners-land'), new Criterion_1.default(impassable_1.fromLand), new Criterion_1.default((0, impassable_1.toPartnersLand)(partnerOf)), new Effect_1.default(impassable_1.impassable)),
            ],
        lostAtSea: [
            new LostAtSea_1.default(id('lost-at-sea/emit'), new Effect_1.default((0, lostAtSea_1.emitLostAtSea)(engine))),
            new LostAtSea_1.default(
            // Before `destroy`, while the manifests still say what's aboard.
            id('lost-at-sea/count-loss'), new Effect_1.default((0, lostAtSea_1.countLosses)(unitLossRegistry, transportRegistry))),
            new LostAtSea_1.default(id('lost-at-sea/destroy'), new Effect_1.default(lostAtSea_1.sink)),
        ],
        playerAction: [
            new Action_1.default(`${prefix}:player/action/active-units`, new Criterion_1.default((0, playerAction_1.hasActiveUnits)(unitRegistry)), new Effect_1.default((0, playerAction_1.activeUnits)(unitRegistry, ActiveUnit))),
            new Action_1.default(`${prefix}:player/action/inactive-units`, new Criterion_1.default((0, playerAction_1.hasInactiveUnits)(unitRegistry)), new Effect_1.default((0, playerAction_1.inactiveUnits)(unitRegistry, InactiveUnit))),
        ],
        stowed: [new Stowed_1.default(id('stowed/sleep'), new Effect_1.default(stowed_1.sleepAboard))],
        transferred: [
            new Transferred_1.default(id('transferred/emit'), new Effect_1.default((unit, player, previousPlayer) => {
                engine.emit('unit:transferred', unit, player, previousPlayer);
            })),
        ],
        unsupported: [
            new Unsupported_1.default(id('unsupported/emit'), new Effect_1.default((0, unsupported_1.emitUnsupported)(engine))),
        ],
        validateMove: [
            new ValidateMove_1.default(id('validate-move/enough-moves'), new Criterion_1.default(validateMove_1.hasMovesFor), new Effect_1.default(validateMove_1.spendMoves)),
            new ValidateMove_1.default(id('validate-move/not-enough-moves'), new Criterion_1.default(validateMove_1.shortOfMovesFor), new Effect_1.default(shortStep === undefined
                ? (0, validateMove_1.spendShort)(shortfallFactor, randomNumberGenerator)
                : (unit, movementCost) => {
                    const remaining = unit.moves().value(), movement = unit.movement().value();
                    unit.moves().set(0);
                    return shortStep.succeeds(unit, remaining, movement, movementCost, randomNumberGenerator);
                })),
        ],
    };
};
exports.lifecycleRules = lifecycleRules;
exports.default = exports.lifecycleRules;
//# sourceMappingURL=lifecycleRules.js.map