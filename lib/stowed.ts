import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Sleep from '@civ-clone/base-unit-action-sleep/Sleep';
import Unit from '@civ-clone/core-unit/Unit';

// A unit that has just boarded a transport sleeps aboard it. Returns what `unit.action` returns. Its `Sleeping` looks
//  for enemies in core-unit's instance: a ruleset registers `sleepAboardWith` its game's own registries instead.
export const sleepAboard = (unit: Unit) =>
  unit.action(new Sleep(unit.tile(), unit.tile(), unit));

/**
 * `sleepAboard` for a game's own rule registry, turn and unit registry, so its `Sleeping` looks for enemies among that
 *  game's units (civ-clone/web-renderer#1110). Takes the unit alone, so it can be a `Stowed` rule's effect, which is
 *  given the unit and its transport.
 */
export const sleepAboardWith =
  (
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    turn: Turn = turnInstance,
    unitRegistry: UnitRegistry = unitRegistryInstance
  ) =>
  (unit: Unit) =>
    unit.action(
      new Sleep(
        unit.tile(),
        unit.tile(),
        unit,
        ruleRegistry,
        turn,
        unitRegistry
      )
    );
