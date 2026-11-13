import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';

// What a ruleset's `Activate` rules ask and do when a unit is woken to take orders.

// The unit has moves left.
export const hasMoves = (unit: Unit): boolean => unit.moves().value() > 0;

// Makes the unit active.
export const setActive = (unit: Unit): void => unit.setActive();

// The unit is busy (sleeping, fortifying, working...).
export const isBusy = (unit: Unit): boolean => unit.busy() !== null;

// Clears what the unit was busy with.
export const clearBusy = (unit: Unit): void => unit.setBusy();

// The unit has an improvement of `UnitImprovementType` (one that waking it should remove, such as being fortified).
export const hasImprovement =
  (
    unitImprovementRegistry: UnitImprovementRegistry,
    UnitImprovementType: typeof UnitImprovement
  ) =>
  (unit: Unit): boolean =>
    unitImprovementRegistry
      .getByUnit(unit)
      .some(
        (unitImprovement: UnitImprovement): boolean =>
          unitImprovement instanceof UnitImprovementType
      );

// Removes the unit's improvements of `UnitImprovementType`.
export const removeImprovement =
  (
    unitImprovementRegistry: UnitImprovementRegistry,
    UnitImprovementType: typeof UnitImprovement
  ) =>
  (unit: Unit): void =>
    unitImprovementRegistry.unregister(
      ...unitImprovementRegistry
        .getByUnit(unit)
        .filter(
          (unitImprovement: UnitImprovement): boolean =>
            unitImprovement instanceof UnitImprovementType
        )
    );
