import Engine from '@civ-clone/core-engine/Engine';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// Emits `unit:halted` with the unit and its destination: a GoTo stopped next to it, for the player to choose what to
//  do there.
export const emitHalted =
  (engine: Engine) =>
  (unit: Unit, target: Tile): void => {
    engine.emit('unit:halted', unit, target);
  };
