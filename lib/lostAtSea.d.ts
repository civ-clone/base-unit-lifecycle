import Engine from '@civ-clone/core-engine/Engine';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import TransportRegistry from '@civ-clone/core-unit-transport/TransportRegistry';
import UnitLossRegistry from '@civ-clone/core-unit/UnitLossRegistry';
export declare const emitLostAtSea: (
  engine: Engine
) => (unit: ITransport) => void;
export declare const countLosses: (
  unitLossRegistry: UnitLossRegistry,
  transportRegistry: TransportRegistry
) => (transport: ITransport) => void;
export declare const sink: (unit: ITransport) => void;
