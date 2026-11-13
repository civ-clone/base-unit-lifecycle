"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inactiveUnits = exports.hasInactiveUnits = exports.activeUnits = exports.hasActiveUnits = void 0;
// The player has an active unit with moves left.
const hasActiveUnits = (unitRegistry) => (player) => unitRegistry
    .getByPlayer(player)
    .some((unit) => unit.active() && unit.moves().value());
exports.hasActiveUnits = hasActiveUnits;
// The player's active units with moves left, as `PlayerActionType`s.
const activeUnits = (unitRegistry, PlayerActionType) => (player) => unitRegistry
    .getByPlayer(player)
    .filter((unit) => unit.active() && unit.moves().value() > 0)
    .sort((a, b) => (a.waiting() ? 1 : 0) - (b.waiting() ? 1 : 0))
    .map((unit) => new PlayerActionType(player, unit));
exports.activeUnits = activeUnits;
// The player has a unit that is inactive or has no moves left.
const hasInactiveUnits = (unitRegistry) => (player) => unitRegistry
    .getByPlayer(player)
    .some((unit) => !unit.active() || !unit.moves().value());
exports.hasInactiveUnits = hasInactiveUnits;
// The player's units that are inactive or have no moves left, as `PlayerActionType`s.
const inactiveUnits = (unitRegistry, PlayerActionType) => (player) => unitRegistry
    .getByPlayer(player)
    .filter((unit) => !unit.active() || unit.moves().value() === 0)
    .sort((a, b) => (a.waiting() ? 1 : 0) - (b.waiting() ? 1 : 0))
    .map((unit) => new PlayerActionType(player, unit));
exports.inactiveUnits = inactiveUnits;
//# sourceMappingURL=playerAction.js.map