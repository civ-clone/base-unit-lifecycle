"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeImprovement = exports.hasImprovement = exports.clearBusy = exports.isBusy = exports.setActive = exports.hasMoves = void 0;
// What a ruleset's `Activate` rules ask and do when a unit is woken to take orders.
// The unit has moves left.
const hasMoves = (unit) => unit.moves().value() > 0;
exports.hasMoves = hasMoves;
// Makes the unit active.
const setActive = (unit) => unit.setActive();
exports.setActive = setActive;
// The unit is busy (sleeping, fortifying, working...).
const isBusy = (unit) => unit.busy() !== null;
exports.isBusy = isBusy;
// Clears what the unit was busy with.
const clearBusy = (unit) => unit.setBusy();
exports.clearBusy = clearBusy;
// The unit has an improvement of `UnitImprovementType` (one that waking it should remove, such as being fortified).
const hasImprovement = (unitImprovementRegistry, UnitImprovementType) => (unit) => unitImprovementRegistry
    .getByUnit(unit)
    .some((unitImprovement) => unitImprovement instanceof UnitImprovementType);
exports.hasImprovement = hasImprovement;
// Removes the unit's improvements of `UnitImprovementType`.
const removeImprovement = (unitImprovementRegistry, UnitImprovementType) => (unit) => unitImprovementRegistry.unregister(...unitImprovementRegistry
    .getByUnit(unit)
    .filter((unitImprovement) => unitImprovement instanceof UnitImprovementType));
exports.removeImprovement = removeImprovement;
//# sourceMappingURL=activate.js.map