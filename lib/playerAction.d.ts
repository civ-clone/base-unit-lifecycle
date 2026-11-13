import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
export type UnitPlayerActionType<T extends PlayerAction> = new (
  player: Player,
  unit: Unit
) => T;
export declare const hasActiveUnits: (
  unitRegistry: UnitRegistry
) => (player: Player) => boolean;
export declare const activeUnits: <T extends PlayerAction<any>>(
  unitRegistry: UnitRegistry,
  PlayerActionType: UnitPlayerActionType<T>
) => (player: Player) => T[];
export declare const hasInactiveUnits: (
  unitRegistry: UnitRegistry
) => (player: Player) => boolean;
export declare const inactiveUnits: <T extends PlayerAction<any>>(
  unitRegistry: UnitRegistry,
  PlayerActionType: UnitPlayerActionType<T>
) => (player: Player) => T[];
