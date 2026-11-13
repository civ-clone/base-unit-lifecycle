import { PartnerOf } from '@civ-clone/base-unit-action-rules/lib/criteria/partners';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';

// What a ruleset's `Impassable` rules ask, so that routes (a GoTo, a computer player's route) go round a treaty
//  partner's land and following one never breaks a treaty by accident.

// The step starts on land.
export const fromLand = (unit: Unit, to: Tile, from: Tile): boolean =>
  from.isLand();

// `to` is a treaty partner's land: `partnerOf` is the ruleset's territory model.
export const toPartnersLand =
  (partnerOf: PartnerOf) =>
  (unit: Unit, to: Tile): boolean =>
    partnerOf(unit, to) !== null;

// The tile is impassable.
export const impassable = (): boolean => true;
