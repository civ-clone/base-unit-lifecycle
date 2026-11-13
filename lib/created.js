"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitCreated = exports.setMoves = exports.applyVisibility = exports.registerUnit = void 0;
// What a ruleset's `Created` rules do with a new unit, one function for each rule's effect.
// Adds the unit to `unitRegistry`.
const registerUnit = (unitRegistry) => (unit) => unitRegistry.register(unit);
exports.registerUnit = registerUnit;
// Reveals what the unit can see to its player.
const applyVisibility = (unit) => unit.applyVisibility();
exports.applyVisibility = applyVisibility;
// Gives the unit its full moves.
const setMoves = (unit) => unit.moves().set(unit.movement());
exports.setMoves = setMoves;
// Emits `unit:created` with the unit.
const emitCreated = (engine) => (unit) => {
    engine.emit('unit:created', unit);
};
exports.emitCreated = emitCreated;
//# sourceMappingURL=created.js.map