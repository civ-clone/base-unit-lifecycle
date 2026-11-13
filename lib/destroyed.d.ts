import Engine from '@civ-clone/core-engine/Engine';
import Player from '@civ-clone/core-player/Player';
import TransportManifest from '@civ-clone/core-unit-transport/TransportManifest';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import UnitLossRegistry from '@civ-clone/core-unit/UnitLossRegistry';
export declare const emitDestroyed: (
  engine: Engine
) => (unit: Unit, player: Player | null) => void;
export declare const destroyedByAnother: (
  unit: Unit,
  player: Player | null
) => boolean;
export declare const notYetDestroyed: (unit: Unit) => boolean;
export declare const countLoss: (
  unitLossRegistry: UnitLossRegistry
) => (unit: Unit) => void;
export declare const deactivate: (unit: Unit) => void;
export declare const removeImprovements: (
  unitImprovementRegistry: UnitImprovementRegistry
) => (unit: Unit) => void;
export declare const leaveTransport: (
  transportRegistry: TransportRegistry
) => (manifest: TransportManifest) => void;
export declare const carriesCargo: (
  transportRegistry: TransportRegistry
) => (unit: Unit) => boolean;
export declare const loseCargo: (
  transportRegistry: TransportRegistry
) => (unit: Unit, player: Player | null) => void;
export declare const isAboard: (
  transportRegistry: TransportRegistry
) => (unit: Unit) => boolean;
export declare const leaveOwnTransport: (
  transportRegistry: TransportRegistry
) => (unit: Unit) => void;
