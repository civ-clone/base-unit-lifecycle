import Unit from '@civ-clone/core-unit/Unit';
import { succeedsShort } from '@civ-clone/base-unit-action-rules/lib/moveShortfall';

// What a ruleset's `ValidateMove` rules ask and do when `unit` makes a step costing `movementCost` moves.

// The unit has the moves the step costs.
export const hasMovesFor = (unit: Unit, movementCost: number): boolean =>
  unit.moves().value() >= movementCost;

// Spends the moves the step costs. The step succeeds.
export const spendMoves = (unit: Unit, movementCost: number): boolean => {
  unit.moves().subtract(movementCost);

  return true;
};

// The unit is short of the moves the step costs.
export const shortOfMovesFor = (unit: Unit, movementCost: number): boolean =>
  unit.moves().value() < movementCost;

// Spends all the unit's remaining moves on a step it is short of moves for, and says whether it gets there
//  (`succeedsShort`, with `shortfallFactor` and a draw of `randomNumberGenerator`).
export const spendShort =
  (shortfallFactor: number, randomNumberGenerator: () => number) =>
  (unit: Unit, movementCost: number): boolean => {
    const remainingMoves = unit.moves().value();

    unit.moves().set(0);

    return succeedsShort(
      remainingMoves,
      movementCost,
      shortfallFactor,
      randomNumberGenerator
    );
  };
