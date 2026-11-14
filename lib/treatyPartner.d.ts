import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
export interface TreatyPartnerDependencies {
  interactionRegistry?: InteractionRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  workedTileRegistry?: WorkedTileRegistry;
}
/**
 * Whose land a tile is, among a unit's treaty partners, or `null`: a tile that one of the partner's cities is working
 * and that has one of `improvements` on it, for a land unit that isn't a `NonCombatant`. Moving onto or pillaging such
 * a tile breaks the treaty. A tile counts as land while it's worked (Civ1's territory model, simplified).
 */
export declare const treatyPartner: (
  improvements: (typeof TileImprovement)[],
  {
    interactionRegistry,
    tileImprovementRegistry,
    workedTileRegistry,
  }?: TreatyPartnerDependencies
) => (unit: Unit, tile: Tile) => Player | null;
export default treatyPartner;
