import Engine from '@civ-clone/core-engine/Engine';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const emitHalted: (
  engine: Engine
) => (unit: Unit, target: Tile) => void;
