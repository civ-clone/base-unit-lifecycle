import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
export declare const hasMoves: (unit: Unit) => boolean;
export declare const setActive: (unit: Unit) => void;
export declare const isBusy: (unit: Unit) => boolean;
export declare const clearBusy: (unit: Unit) => void;
export declare const hasImprovement: (
  unitImprovementRegistry: UnitImprovementRegistry,
  UnitImprovementType: typeof UnitImprovement
) => (unit: Unit) => boolean;
export declare const removeImprovement: (
  unitImprovementRegistry: UnitImprovementRegistry,
  UnitImprovementType: typeof UnitImprovement
) => (unit: Unit) => void;
