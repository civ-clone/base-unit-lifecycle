import Sleep from '@civ-clone/base-unit-action-sleep/Sleep';
import Unit from '@civ-clone/core-unit/Unit';

// A unit that has just boarded a transport sleeps aboard it. Returns what `unit.action` returns.
export const sleepAboard = (unit: Unit) =>
  unit.action(new Sleep(unit.tile(), unit.tile(), unit));
