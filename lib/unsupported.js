"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitUnsupported = void 0;
// Emits `unit:unsupported` with the city that could no longer support the unit, and the unit.
const emitUnsupported = (engine) => (city, unit) => {
    engine.emit('unit:unsupported', city, unit);
};
exports.emitUnsupported = emitUnsupported;
//# sourceMappingURL=unsupported.js.map