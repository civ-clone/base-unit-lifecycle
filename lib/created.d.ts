import Engine from '@civ-clone/core-engine/Engine';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
export declare const registerUnit: (
  unitRegistry: UnitRegistry
) => (unit: Unit) => void;
export declare const applyVisibility: (unit: Unit) => void;
export declare const setMoves: (unit: Unit) => void;
export declare const emitCreated: (engine: Engine) => (unit: Unit) => void;
