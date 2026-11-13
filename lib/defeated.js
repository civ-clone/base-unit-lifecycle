"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyStack = exports.hasStack = exports.notInCity = exports.defended = exports.emitAndDestroy = void 0;
const Destroyed_1 = require("@civ-clone/core-unit/Rules/Destroyed");
// What a ruleset's `Defeated` rules ask and do when `unit` loses a fight to `by`. `action`, when given, is the attack:
//  `action.unit()` attacked.
// Emits `unit:defeated` with the unit, the winner and the attack, then destroys the unit (`Destroyed`), credited to
//  the winner's player.
const emitAndDestroy = (engine, ruleRegistry) => (unit, by, action) => {
    engine.emit('unit:defeated', unit, by, action);
    ruleRegistry.process(Destroyed_1.default, unit, by.player());
};
exports.emitAndDestroy = emitAndDestroy;
// The defeated unit defended: `Attack` processes `Defeated` for a losing attacker too.
const defended = (unit, by, action) => !action || action.unit() !== unit;
exports.defended = defended;
// The defeated unit is not in a city.
const notInCity = (cityRegistry) => (unit) => cityRegistry.getByTile(unit.tile()) === null;
exports.notInCity = notInCity;
// Other units of the defeated unit's player share its tile.
const hasStack = (unitRegistry) => (unit) => unitRegistry
    .getByTile(unit.tile())
    .filter((tileUnit) => tileUnit !== unit && tileUnit.player() === unit.player()).length > 0;
exports.hasStack = hasStack;
// Destroys (`Destroyed`) every other unit of the defeated unit's player on its tile, credited to the winner's player.
const destroyStack = (unitRegistry, ruleRegistry) => (unit, by) => unitRegistry
    .getByTile(unit.tile())
    .filter((tileUnit) => tileUnit !== unit && tileUnit.player() === unit.player())
    .forEach((tileUnit) => {
    ruleRegistry.process(Destroyed_1.default, tileUnit, by.player());
});
exports.destroyStack = destroyStack;
//# sourceMappingURL=defeated.js.map