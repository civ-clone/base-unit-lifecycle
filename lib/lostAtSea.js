"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sink = exports.countLosses = exports.emitLostAtSea = void 0;
// What a ruleset's `LostAtSea` rules do when a transport is lost at sea.
// Emits `unit:lost-at-sea` with the transport.
const emitLostAtSea = (engine) => (unit) => {
    engine.emit('unit:lost-at-sea', unit);
};
exports.emitLostAtSea = emitLostAtSea;
// Records the transport and everything aboard that isn't destroyed yet as losses of their players, though no one
//  destroyed them. Run it before `sink`, while the manifests still say what's aboard.
const countLosses = (unitLossRegistry, transportRegistry) => (transport) => [
    transport,
    ...transportRegistry
        .getByTransport(transport)
        .map((manifest) => manifest.unit()),
]
    .filter((unit) => !unit.destroyed())
    .forEach((unit) => {
    unitLossRegistry.record(unit.player(), unit.sourceClass());
});
exports.countLosses = countLosses;
// Destroys the transport, by no one.
const sink = (unit) => unit.destroy(null);
exports.sink = sink;
//# sourceMappingURL=lostAtSea.js.map