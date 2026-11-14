import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { UnitLossRegistry } from '@civ-clone/core-unit/UnitLossRegistry';
import { UnitPlayerActionType } from './playerAction';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-player/Rules/Action';
import Activate from '@civ-clone/core-unit/Rules/Activate';
import CanStow from '@civ-clone/core-unit-transport/Rules/CanStow';
import Created from '@civ-clone/core-unit/Rules/Created';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
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
  ActiveUnit: UnitPlayerActionType<PlayerAction>;
  InactiveUnit: UnitPlayerActionType<PlayerAction>;
  removedOnActivate: (typeof UnitImprovement)[];
  stowable: (typeof Unit)[];
  partnerOf?: (unit: Unit, tile: Tile) => Player | null;
  shortfallFactor: number;
}
/**
 * A ruleset's unit lifecycle rules, by the rule type they are, in the order each type's rules run. Their ids are
 * `<prefix>:unit/<type>/<name>` (`<prefix>:player/action/<name>` for the player actions), as civ1-unit's are, so a
 * ruleset registers each list where it wants it and keeps the ids another package may name.
 */
export declare const lifecycleRules: (
  prefix: string,
  {
    cityRegistry,
    engine,
    randomNumberGenerator,
    ruleRegistry,
    transportRegistry,
    unitImprovementRegistry,
    unitLossRegistry,
    unitRegistry,
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
  activate: Activate[];
  canStow: CanStow[];
  created: Created[];
  defeated: Defeated[];
  destroyed: Destroyed[];
  expectedMovementCost: ExpectedMovementCost[];
  halted: Halted[];
  impassable: Impassable[];
  lostAtSea: LostAtSea[];
  playerAction: Action[];
  stowed: Stowed[];
  transferred: Transferred[];
  unsupported: Unsupported[];
  validateMove: ValidateMove[];
};
export type LifecycleRules = ReturnType<typeof lifecycleRules>;
export default lifecycleRules;
