import { PartnerOf } from '@civ-clone/base-unit-action-rules/lib/criteria/partners';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export declare const fromLand: (unit: Unit, to: Tile, from: Tile) => boolean;
export declare const toPartnersLand: (
  partnerOf: PartnerOf
) => (unit: Unit, to: Tile) => boolean;
export declare const impassable: () => boolean;
