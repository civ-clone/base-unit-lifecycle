"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitHalted = void 0;
// Emits `unit:halted` with the unit and its destination: a GoTo stopped next to it, for the player to choose what to
//  do there.
const emitHalted = (engine) => (unit, target) => {
    engine.emit('unit:halted', unit, target);
};
exports.emitHalted = emitHalted;
//# sourceMappingURL=halted.js.map