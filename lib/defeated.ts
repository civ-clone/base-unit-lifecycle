import Action from '@civ-clone/core-unit/Action';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
import Engine from '@civ-clone/core-engine/Engine';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';

// What a ruleset's `Defeated` rules ask and do when `unit` loses a fight to `by`. `action`, when given, is the attack:
//  `action.unit()` attacked.

// Emits `unit:defeated` with the unit, the winner and the attack, then destroys the unit (`Destroyed`), credited to
//  the winner's player.
export const emitAndDestroy =
  (engine: Engine, ruleRegistry: RuleRegistry) =>
  (unit: Unit, by: Unit, action?: Action): void => {
    engine.emit('unit:defeated', unit, by, action);

    ruleRegistry.process(Destroyed, unit, by.player());
  };

// The defeated unit defended: `Attack` processes `Defeated` for a losing attacker too.
export const defended = (unit: Unit, by: Unit, action?: Action): boolean =>
  !action || action.unit() !== unit;

// The defeated unit is not in a city.
export const notInCity =
  (cityRegistry: CityRegistry) =>
  (unit: Unit): boolean =>
    cityRegistry.getByTile(unit.tile()) === null;

// Other units of the defeated unit's player share its tile.
export const hasStack =
  (unitRegistry: UnitRegistry) =>
  (unit: Unit): boolean =>
    unitRegistry
      .getByTile(unit.tile())
      .filter(
        (tileUnit: Unit) =>
          tileUnit !== unit && tileUnit.player() === unit.player()
      ).length > 0;

// Destroys (`Destroyed`) every other unit of the defeated unit's player on its tile, credited to the winner's player.
export const destroyStack =
  (unitRegistry: UnitRegistry, ruleRegistry: RuleRegistry) =>
  (unit: Unit, by: Unit): void =>
    unitRegistry
      .getByTile(unit.tile())
      .filter(
        (tileUnit: Unit): boolean =>
          tileUnit !== unit && tileUnit.player() === unit.player()
      )
      .forEach((tileUnit: Unit): void => {
        ruleRegistry.process(Destroyed, tileUnit, by.player());
      });
