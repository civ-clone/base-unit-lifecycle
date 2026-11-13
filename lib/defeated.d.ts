import Action from '@civ-clone/core-unit/Action';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Engine from '@civ-clone/core-engine/Engine';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
export declare const emitAndDestroy: (
  engine: Engine,
  ruleRegistry: RuleRegistry
) => (unit: Unit, by: Unit, action?: Action) => void;
export declare const defended: (
  unit: Unit,
  by: Unit,
  action?: Action
) => boolean;
export declare const notInCity: (
  cityRegistry: CityRegistry
) => (unit: Unit) => boolean;
export declare const hasStack: (
  unitRegistry: UnitRegistry
) => (unit: Unit) => boolean;
export declare const destroyStack: (
  unitRegistry: UnitRegistry,
  ruleRegistry: RuleRegistry
) => (unit: Unit, by: Unit) => void;
