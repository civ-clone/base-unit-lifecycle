import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  UnitLossRegistry,
  instance as unitLossRegistryInstance,
} from '@civ-clone/core-unit/UnitLossRegistry';
import {
  UnitPlayerActionType,
  activeUnits,
  hasActiveUnits,
  hasInactiveUnits,
  inactiveUnits,
} from './playerAction';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  applyVisibility,
  emitCreated,
  registerUnit,
  setMoves,
} from './created';
import {
  carriesCargo,
  countLoss,
  deactivate,
  destroyedByAnother,
  emitDestroyed,
  isAboard,
  leaveOwnTransport,
  loseCargo,
  notYetDestroyed,
  removeImprovements,
} from './destroyed';
import { carriesDomain, carriesUnit } from './canStow';
import {
  clearBusy,
  hasImprovement,
  hasMoves,
  isBusy,
  removeImprovement,
  setActive,
} from './activate';
import { countLosses, emitLostAtSea, sink } from './lostAtSea';
import {
  defended,
  destroyStack,
  emitAndDestroy,
  hasStack,
  notInCity,
} from './defeated';
import { fromLand, impassable, toPartnersLand } from './impassable';
import {
  hasMovesFor,
  shortOfMovesFor,
  spendMoves,
  spendShort,
} from './validateMove';
import Action from '@civ-clone/core-player/Rules/Action';
import Activate from '@civ-clone/core-unit/Rules/Activate';
import CanStow from '@civ-clone/core-unit-transport/Rules/CanStow';
import Created from '@civ-clone/core-unit/Rules/Created';
import Criterion from '@civ-clone/core-rule/Criterion';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import ExpectedMovementCost from '@civ-clone/core-world-path/Rules/ExpectedMovementCost';
import Halted from '@civ-clone/base-unit-action-goto/Rules/Halted';
import Impassable from '@civ-clone/core-world-path/Rules/Impassable';
import LostAtSea from '@civ-clone/core-unit-transport/Rules/LostAtSea';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Stowed from '@civ-clone/core-unit-transport/Rules/Stowed';
import Tile from '@civ-clone/core-world/Tile';
import Transferred from '@civ-clone/core-unit/Rules/Transferred';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import Unsupported from '@civ-clone/core-unit/Rules/Unsupported';
import ValidateMove from '@civ-clone/core-unit/Rules/ValidateMove';
import { emitHalted } from './halted';
import { emitUnsupported } from './unsupported';
import { expectedCost } from '@civ-clone/base-unit-action-rules/lib/moveShortfall';
import { instance as rngInstance } from '@civ-clone/core-random';
import { sleepAboard } from './stowed';

export interface LifecycleDependencies {
  cityRegistry?: CityRegistry;
  engine?: Engine;
  randomNumberGenerator?: () => number;
  ruleRegistry?: RuleRegistry;
  transportRegistry?: TransportRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
  unitLossRegistry?: UnitLossRegistry;
  unitRegistry?: UnitRegistry;
}

export interface LifecycleOptions {
  // The player actions a unit that can take orders, and one that can't, is offered as.
  ActiveUnit: UnitPlayerActionType<PlayerAction>;
  InactiveUnit: UnitPlayerActionType<PlayerAction>;
  // The unit improvements activating a unit takes off it (a Fortified state), each with a rule of its own.
  removedOnActivate: (typeof UnitImprovement)[];
  // The domains a transport may carry, each with a `CanStow` rule of its own (`Carries` traits).
  stowable: (typeof Unit)[];
  // Whose land `tile` is among `unit`'s treaty partners, or `null`: routes go round it. Without it, no rule is made.
  partnerOf?: (unit: Unit, tile: Tile) => Player | null;
  // How far short of a step's cost a unit may be and still try it (`spendShort`).
  shortfallFactor: number;
}

/**
 * A ruleset's unit lifecycle rules, by the rule type they are, in the order each type's rules run. Their ids are
 * `<prefix>:unit/<type>/<name>` (`<prefix>:player/action/<name>` for the player actions), as civ1-unit's are, so a
 * ruleset registers each list where it wants it and keeps the ids another package may name.
 */
export const lifecycleRules = (
  prefix: string,
  {
    cityRegistry = cityRegistryInstance,
    engine = engineInstance,
    randomNumberGenerator = rngInstance,
    ruleRegistry = ruleRegistryInstance,
    transportRegistry = transportRegistryInstance,
    unitImprovementRegistry = unitImprovementRegistryInstance,
    unitLossRegistry = unitLossRegistryInstance,
    unitRegistry = unitRegistryInstance,
  }: LifecycleDependencies,
  {
    ActiveUnit,
    InactiveUnit,
    removedOnActivate,
    stowable,
    partnerOf,
    shortfallFactor,
  }: LifecycleOptions
) => {
  const id = (name: string): string => `${prefix}:unit/${name}`;

  return {
    activate: [
      new Activate(
        id('activate/has-moves'),
        new Criterion(hasMoves),
        new Effect(setActive)
      ),
      new Activate(
        id('activate/clear-busy'),
        new Criterion(isBusy),
        new Effect(clearBusy)
      ),
      ...removedOnActivate.map(
        (UnitImprovementType: typeof UnitImprovement): Activate =>
          new Activate(
            id(`activate/remove-improvement/${UnitImprovementType.name}`),
            new Criterion(
              hasImprovement(unitImprovementRegistry, UnitImprovementType)
            ),
            new Effect(
              removeImprovement(unitImprovementRegistry, UnitImprovementType)
            )
          )
      ),
    ],

    canStow: stowable.map(
      (StowableUnitType: typeof Unit): CanStow =>
        new CanStow(
          id(`can-stow/${StowableUnitType.name}`),
          new Criterion(carriesDomain(StowableUnitType)),
          new Effect(carriesUnit(StowableUnitType))
        )
    ),

    created: [
      new Created(
        id('created/register'),
        new Effect(registerUnit(unitRegistry))
      ),
      new Created(id('created/apply-visibility'), new Effect(applyVisibility)),
      new Created(id('created/set-moves'), new Effect(setMoves)),
      new Created(id('created/emit'), new Effect(emitCreated(engine))),
    ],

    defeated: [
      new Defeated(
        id('defeated/emit-and-destroy'),
        new Effect(emitAndDestroy(engine, ruleRegistry))
      ),
      new Defeated(
        // `Attack` processes `Defeated` for a losing attacker too; only a defeated defender takes its stack with it.
        id('defeated/destroy-stack'),
        new Criterion(defended),
        new Criterion(notInCity(cityRegistry)),
        new Criterion(hasStack(unitRegistry)),
        new Effect(destroyStack(unitRegistry, ruleRegistry))
      ),
    ],

    destroyed: [
      new Destroyed(id('destroyed/emit'), new Effect(emitDestroyed(engine))),
      new Destroyed(
        // A loss, once, for a unit another player destroyed.
        id('destroyed/count-loss'),
        new Criterion(destroyedByAnother),
        new Criterion(notYetDestroyed),
        new Effect(countLoss(unitLossRegistry))
      ),
      new Destroyed(id('destroyed/deactivate'), new Effect(deactivate)),
      new Destroyed(
        id('destroyed/remove-improvements'),
        new Effect(removeImprovements(unitImprovementRegistry))
      ),
      new Destroyed(
        id('destroyed/lose-cargo'),
        new Criterion(carriesCargo(transportRegistry)),
        new Effect(loseCargo(transportRegistry))
      ),
      new Destroyed(
        id('destroyed/leave-transport'),
        new Criterion(isAboard(transportRegistry)),
        new Effect(leaveOwnTransport(transportRegistry))
      ),
    ],

    expectedMovementCost: [
      new ExpectedMovementCost(
        // A step costing more than the unit's full moves is worth `max(m, c × shortfallFactor)` on average.
        id('expected-movement-cost/shortfall'),
        new Criterion(
          (unit: Unit, movementCost: number, movement: number): boolean =>
            movement > 0
        ),
        new Effect(
          (unit: Unit, movementCost: number, movement: number): number =>
            expectedCost(movement, movementCost, shortfallFactor)
        )
      ),
    ],

    halted: [new Halted(id('halted/emit'), new Effect(emitHalted(engine)))],

    impassable:
      partnerOf === undefined
        ? []
        : [
            new Impassable(
              // Routes go round a treaty partner's land, so following one never breaks a treaty by accident.
              id('impassable/treaty-partners-land'),
              new Criterion(fromLand),
              new Criterion(toPartnersLand(partnerOf)),
              new Effect(impassable)
            ),
          ],

    lostAtSea: [
      new LostAtSea(id('lost-at-sea/emit'), new Effect(emitLostAtSea(engine))),
      new LostAtSea(
        // Before `destroy`, while the manifests still say what's aboard.
        id('lost-at-sea/count-loss'),
        new Effect(countLosses(unitLossRegistry, transportRegistry))
      ),
      new LostAtSea(id('lost-at-sea/destroy'), new Effect(sink)),
    ],

    playerAction: [
      new Action(
        `${prefix}:player/action/active-units`,
        new Criterion(hasActiveUnits(unitRegistry)),
        new Effect(activeUnits(unitRegistry, ActiveUnit))
      ),
      new Action(
        `${prefix}:player/action/inactive-units`,
        new Criterion(hasInactiveUnits(unitRegistry)),
        new Effect(inactiveUnits(unitRegistry, InactiveUnit))
      ),
    ],

    stowed: [new Stowed(id('stowed/sleep'), new Effect(sleepAboard))],

    transferred: [
      new Transferred(
        id('transferred/emit'),
        new Effect(
          (unit: Unit, player: Player, previousPlayer: Player): void => {
            engine.emit('unit:transferred', unit, player, previousPlayer);
          }
        )
      ),
    ],

    unsupported: [
      new Unsupported(
        id('unsupported/emit'),
        new Effect(emitUnsupported(engine))
      ),
    ],

    validateMove: [
      new ValidateMove(
        id('validate-move/enough-moves'),
        new Criterion(hasMovesFor),
        new Effect(spendMoves)
      ),
      new ValidateMove(
        id('validate-move/not-enough-moves'),
        new Criterion(shortOfMovesFor),
        new Effect(spendShort(shortfallFactor, randomNumberGenerator))
      ),
    ],
  };
};

export type LifecycleRules = ReturnType<typeof lifecycleRules>;

export default lifecycleRules;
