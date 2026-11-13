import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';

// What a ruleset's player `Action` rules ask and offer: the player's units that can take orders this turn, and those
//  that can't. Each list puts waiting units last and otherwise keeps the registry's order. `PlayerActionType` is the
//  player action each unit is offered as (an active unit, an inactive one).

// The constructor of a player action for one unit.
export type UnitPlayerActionType<T extends PlayerAction> = new (
  player: Player,
  unit: Unit
) => T;

// The player has an active unit with moves left.
export const hasActiveUnits =
  (unitRegistry: UnitRegistry) =>
  (player: Player): boolean =>
    unitRegistry
      .getByPlayer(player)
      .some((unit) => unit.active() && unit.moves().value());

// The player's active units with moves left, as `PlayerActionType`s.
export const activeUnits =
  <T extends PlayerAction>(
    unitRegistry: UnitRegistry,
    PlayerActionType: UnitPlayerActionType<T>
  ) =>
  (player: Player): T[] =>
    unitRegistry
      .getByPlayer(player)
      .filter(
        (unit: Unit): boolean => unit.active() && unit.moves().value() > 0
      )
      .sort(
        (a: Unit, b: Unit): number =>
          (a.waiting() ? 1 : 0) - (b.waiting() ? 1 : 0)
      )
      .map((unit: Unit): T => new PlayerActionType(player, unit));

// The player has a unit that is inactive or has no moves left.
export const hasInactiveUnits =
  (unitRegistry: UnitRegistry) =>
  (player: Player): boolean =>
    unitRegistry
      .getByPlayer(player)
      .some((unit) => !unit.active() || !unit.moves().value());

// The player's units that are inactive or have no moves left, as `PlayerActionType`s.
export const inactiveUnits =
  <T extends PlayerAction>(
    unitRegistry: UnitRegistry,
    PlayerActionType: UnitPlayerActionType<T>
  ) =>
  (player: Player): T[] =>
    unitRegistry
      .getByPlayer(player)
      .filter((unit: Unit) => !unit.active() || unit.moves().value() === 0)
      .sort(
        (a: Unit, b: Unit): number =>
          (a.waiting() ? 1 : 0) - (b.waiting() ? 1 : 0)
      )
      .map((unit) => new PlayerActionType(player, unit));
