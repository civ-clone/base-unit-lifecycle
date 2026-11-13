import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import Unit from '@civ-clone/core-unit/Unit';
export declare const carriesDomain: (
  Domain: typeof Unit
) => (transport: ITransport) => boolean;
export declare const carriesUnit: (
  Domain: typeof Unit
) => (transport: ITransport, unit: Unit) => boolean;
