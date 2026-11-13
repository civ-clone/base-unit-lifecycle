import Unit from '@civ-clone/core-unit/Unit';
export declare const hasMovesFor: (unit: Unit, movementCost: number) => boolean;
export declare const spendMoves: (unit: Unit, movementCost: number) => boolean;
export declare const shortOfMovesFor: (
  unit: Unit,
  movementCost: number
) => boolean;
export declare const spendShort: (
  shortfallFactor: number,
  randomNumberGenerator: () => number
) => (unit: Unit, movementCost: number) => boolean;
