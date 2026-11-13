import Engine from '@civ-clone/core-engine/Engine';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import TransportManifest from '@civ-clone/core-unit-transport/TransportManifest';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitLossRegistry from '@civ-clone/core-unit/UnitLossRegistry';

// What a ruleset's `LostAtSea` rules do when a transport is lost at sea.

// Emits `unit:lost-at-sea` with the transport.
export const emitLostAtSea =
  (engine: Engine) =>
  (unit: ITransport): void => {
    engine.emit('unit:lost-at-sea', unit);
  };

// Records the transport and everything aboard that isn't destroyed yet as losses of their players, though no one
//  destroyed them. Run it before `sink`, while the manifests still say what's aboard.
export const countLosses =
  (unitLossRegistry: UnitLossRegistry, transportRegistry: TransportRegistry) =>
  (transport: ITransport): void =>
    [
      transport as unknown as Unit,
      ...transportRegistry
        .getByTransport(transport)
        .map((manifest: TransportManifest): Unit => manifest.unit()),
    ]
      .filter((unit: Unit): boolean => !unit.destroyed())
      .forEach((unit: Unit): void => {
        unitLossRegistry.record(
          unit.player(),
          unit.sourceClass() as typeof Unit
        );
      });

// Destroys the transport, by no one.
export const sink = (unit: ITransport): void => unit.destroy(null);
