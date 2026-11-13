"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveOwnTransport = exports.isAboard = exports.loseCargo = exports.carriesCargo = exports.leaveTransport = exports.removeImprovements = exports.deactivate = exports.countLoss = exports.notYetDestroyed = exports.destroyedByAnother = exports.emitDestroyed = void 0;
const Stowed_1 = require("@civ-clone/base-unit-action-embark/Busy/Stowed");
const Types_1 = require("@civ-clone/core-terrain/Types");
// What a ruleset's `Destroyed` rules ask and do when `unit` is destroyed. `player` destroyed it, or is `null` when no
//  one did (disbanding, founding or joining a city, a spent unit...).
// Emits `unit:destroyed` with the unit and the player who destroyed it.
const emitDestroyed = (engine) => (unit, player) => {
    engine.emit('unit:destroyed', unit, player);
};
exports.emitDestroyed = emitDestroyed;
// Another player destroyed the unit.
const destroyedByAnother = (unit, player) => player !== null && player !== unit.player();
exports.destroyedByAnother = destroyedByAnother;
// The unit isn't marked destroyed yet: a rule that should act once per unit asks it before `deactivate` runs.
const notYetDestroyed = (unit) => !unit.destroyed();
exports.notYetDestroyed = notYetDestroyed;
// Records the unit's type as a loss of its player's in `unitLossRegistry`.
const countLoss = (unitLossRegistry) => (unit) => {
    unitLossRegistry.record(unit.player(), unit.sourceClass());
};
exports.countLoss = countLoss;
// Makes the unit inactive and marks it destroyed.
const deactivate = (unit) => {
    unit.setActive(false);
    unit.setDestroyed();
};
exports.deactivate = deactivate;
// Removes the unit's improvements (veteran status, fortification...).
const removeImprovements = (unitImprovementRegistry) => (unit) => unitImprovementRegistry
    .getByUnit(unit)
    .forEach((unitImprovement) => unitImprovementRegistry.unregister(unitImprovement));
exports.removeImprovements = removeImprovements;
// Takes a unit off its transport. Nothing clears `Stowed` on its own (its criterion is `() => false`), so a unit taken
//  off a transport, destroyed or not, would otherwise stay stowed aboard nothing.
const leaveTransport = (transportRegistry) => (manifest) => {
    const cargo = manifest.unit();
    transportRegistry.unregister(manifest);
    if (cargo.busy() instanceof Stowed_1.default) {
        cargo.setBusy();
    }
};
exports.leaveTransport = leaveTransport;
// The unit is a transport with something aboard.
const carriesCargo = (transportRegistry) => (unit) => transportRegistry.getByTransport(unit).length > 0;
exports.carriesCargo = carriesCargo;
// Takes everything off the transport (`leaveTransport`). At sea (on `Water`) the cargo goes down with it, destroyed by
//  `player`; in a city it stays in the city.
const loseCargo = (transportRegistry) => {
    const leave = (0, exports.leaveTransport)(transportRegistry);
    return (unit, player) => transportRegistry
        .getByTransport(unit)
        // A copy: unregistering changes the list.
        .slice()
        .forEach((manifest) => {
        const cargo = manifest.unit();
        leave(manifest);
        if (unit.tile().terrain() instanceof Types_1.Water && !cargo.destroyed()) {
            cargo.destroy(player);
        }
    });
};
exports.loseCargo = loseCargo;
// The unit is aboard a transport.
const isAboard = (transportRegistry) => (unit) => transportRegistry.hasUnit(unit);
exports.isAboard = isAboard;
// Takes the unit off the transport it's aboard (`leaveTransport`).
const leaveOwnTransport = (transportRegistry) => {
    const leave = (0, exports.leaveTransport)(transportRegistry);
    return (unit) => leave(transportRegistry.getByUnit(unit));
};
exports.leaveOwnTransport = leaveOwnTransport;
//# sourceMappingURL=destroyed.js.map