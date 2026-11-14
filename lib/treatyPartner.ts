import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import Land from '@civ-clone/base-unit-type-land/Land';
import NonCombatant from '@civ-clone/base-unit-trait-non-combatant/NonCombatant';
import { Peace } from '@civ-clone/library-diplomacy/Declarations';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import { isA } from '@civ-clone/core-unit/traits';

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
export const treatyPartner =
  (
    improvements: (typeof TileImprovement)[],
    {
      interactionRegistry = interactionRegistryInstance,
      tileImprovementRegistry = tileImprovementRegistryInstance,
      workedTileRegistry = workedTileRegistryInstance,
    }: TreatyPartnerDependencies = {}
  ) =>
  (unit: Unit, tile: Tile): Player | null => {
    if (!isA(unit, Land) || unit.hasTrait(NonCombatant)) {
      return null;
    }

    const workedTile = workedTileRegistry.getByTile(tile);

    if (workedTile === null) {
      return null;
    }

    const partner = workedTile.city().player();

    if (
      partner === unit.player() ||
      !interactionRegistry
        .getByPlayers(unit.player(), partner)
        .some(
          (interaction): interaction is Peace =>
            interaction instanceof Peace && interaction.active()
        ) ||
      !tileImprovementRegistry
        .getByTile(tile)
        .some((improvement: TileImprovement): boolean =>
          improvements.some(
            (Improvement: typeof TileImprovement): boolean =>
              improvement instanceof Improvement
          )
        )
    ) {
      return null;
    }

    return partner;
  };

export default treatyPartner;
