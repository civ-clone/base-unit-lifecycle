import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Unit from '@civ-clone/core-unit/Unit';
export declare const sleepAboard: (unit: Unit) => void;
/**
 * `sleepAboard` for a game's own rule registry, turn and unit registry, so its `Sleeping` looks for enemies among that
 *  game's units (civ-clone/web-renderer#1110). Takes the unit alone, so it can be a `Stowed` rule's effect, which is
 *  given the unit and its transport.
 */
export declare const sleepAboardWith: (
  ruleRegistry?: RuleRegistry,
  turn?: Turn,
  unitRegistry?: UnitRegistry
) => (unit: Unit) => void;
