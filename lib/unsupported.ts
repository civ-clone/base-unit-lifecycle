import City from '@civ-clone/core-city/City';
import Engine from '@civ-clone/core-engine/Engine';
import Unit from '@civ-clone/core-unit/Unit';

// Emits `unit:unsupported` with the city that could no longer support the unit, and the unit.
export const emitUnsupported =
  (engine: Engine) =>
  (city: City, unit: Unit): void => {
    engine.emit('unit:unsupported', city, unit);
  };
