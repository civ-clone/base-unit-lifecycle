"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spendShort = exports.shortOfMovesFor = exports.spendMoves = exports.hasMovesFor = void 0;
const moveShortfall_1 = require("@civ-clone/base-unit-action-rules/lib/moveShortfall");
// What a ruleset's `ValidateMove` rules ask and do when `unit` makes a step costing `movementCost` moves.
// The unit has the moves the step costs.
const hasMovesFor = (unit, movementCost) => unit.moves().value() >= movementCost;
exports.hasMovesFor = hasMovesFor;
// Spends the moves the step costs. The step succeeds.
const spendMoves = (unit, movementCost) => {
    unit.moves().subtract(movementCost);
    return true;
};
exports.spendMoves = spendMoves;
// The unit is short of the moves the step costs.
const shortOfMovesFor = (unit, movementCost) => unit.moves().value() < movementCost;
exports.shortOfMovesFor = shortOfMovesFor;
// Spends all the unit's remaining moves on a step it is short of moves for, and says whether it gets there
//  (`succeedsShort`, with `shortfallFactor` and a draw of `randomNumberGenerator`).
const spendShort = (shortfallFactor, randomNumberGenerator) => (unit, movementCost) => {
    const remainingMoves = unit.moves().value();
    unit.moves().set(0);
    return (0, moveShortfall_1.succeedsShort)(remainingMoves, movementCost, shortfallFactor, randomNumberGenerator);
};
exports.spendShort = spendShort;
//# sourceMappingURL=validateMove.js.map