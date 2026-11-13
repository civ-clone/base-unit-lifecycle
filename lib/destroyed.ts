import Engine from '@civ-clone/core-engine/Engine';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import Player from '@civ-clone/core-player/Player';
import Stowed from '@civ-clone/base-unit-action-embark/Busy/Stowed';
import TransportManifest from '@civ-clone/core-unit-transport/TransportManifest';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import UnitLossRegistry from '@civ-clone/core-unit/UnitLossRegistry';
import { Water } from '@civ-clone/core-terrain/Types';

// What a ruleset's `Destroyed` rules ask and do when `unit` is destroyed. `player` destroyed it, or is `null` when no
//  one did (disbanding, founding or joining a city, a spent unit...).

// Emits `unit:destroyed` with the unit and the player who destroyed it.
export const emitDestroyed =
  (engine: Engine) =>
  (unit: Unit, player: Player | null): void => {
    engine.emit('unit:destroyed', unit, player);
  };

// Another player destroyed the unit.
export const destroyedByAnother = (
  unit: Unit,
  player: Player | null
): boolean => player !== null && player !== unit.player();

// The unit isn't marked destroyed yet: a rule that should act once per unit asks it before `deactivate` runs.
export const notYetDestroyed = (unit: Unit): boolean => !unit.destroyed();

// Records the unit's type as a loss of its player's in `unitLossRegistry`.
export const countLoss =
  (unitLossRegistry: UnitLossRegistry) =>
  (unit: Unit): void => {
    unitLossRegistry.record(unit.player(), unit.sourceClass() as typeof Unit);
  };

// Makes the unit inactive and marks it destroyed.
export const deactivate = (unit: Unit): void => {
  unit.setActive(false);
  unit.setDestroyed();
};

// Removes the unit's improvements (veteran status, fortification...).
export const removeImprovements =
  (unitImprovementRegistry: UnitImprovementRegistry) =>
  (unit: Unit): void =>
    unitImprovementRegistry
      .getByUnit(unit)
      .forEach((unitImprovement) =>
        unitImprovementRegistry.unregister(unitImprovement)
      );

// Takes a unit off its transport. Nothing clears `Stowed` on its own (its criterion is `() => false`), so a unit taken
//  off a transport, destroyed or not, would otherwise stay stowed aboard nothing.
export const leaveTransport =
  (transportRegistry: TransportRegistry) =>
  (manifest: TransportManifest): void => {
    const cargo = manifest.unit();

    transportRegistry.unregister(manifest);

    if (cargo.busy() instanceof Stowed) {
      cargo.setBusy();
    }
  };

// The unit is a transport with something aboard.
export const carriesCargo =
  (transportRegistry: TransportRegistry) =>
  (unit: Unit): boolean =>
    transportRegistry.getByTransport(unit as unknown as ITransport).length > 0;

// Takes everything off the transport (`leaveTransport`). At sea (on `Water`) the cargo goes down with it, destroyed by
//  `player`; in a city it stays in the city.
export const loseCargo = (transportRegistry: TransportRegistry) => {
  const leave = leaveTransport(transportRegistry);

  return (unit: Unit, player: Player | null): void =>
    transportRegistry
      .getByTransport(unit as unknown as ITransport)
      // A copy: unregistering changes the list.
      .slice()
      .forEach((manifest: TransportManifest): void => {
        const cargo = manifest.unit();

        leave(manifest);

        if (unit.tile().terrain() instanceof Water && !cargo.destroyed()) {
          cargo.destroy(player);
        }
      });
};

// The unit is aboard a transport.
export const isAboard =
  (transportRegistry: TransportRegistry) =>
  (unit: Unit): boolean =>
    transportRegistry.hasUnit(unit);

// Takes the unit off the transport it's aboard (`leaveTransport`).
export const leaveOwnTransport = (transportRegistry: TransportRegistry) => {
  const leave = leaveTransport(transportRegistry);

  return (unit: Unit): void => leave(transportRegistry.getByUnit(unit));
};
