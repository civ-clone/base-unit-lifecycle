import Engine from '@civ-clone/core-engine/Engine';
import Unit from '@civ-clone/core-unit/Unit';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';

// What a ruleset's `Created` rules do with a new unit, one function for each rule's effect.

// Adds the unit to `unitRegistry`.
export const registerUnit =
  (unitRegistry: UnitRegistry) =>
  (unit: Unit): void =>
    unitRegistry.register(unit);

// Reveals what the unit can see to its player.
export const applyVisibility = (unit: Unit): void => unit.applyVisibility();

// Gives the unit its full moves.
export const setMoves = (unit: Unit): void => unit.moves().set(unit.movement());

// Emits `unit:created` with the unit.
export const emitCreated =
  (engine: Engine) =>
  (unit: Unit): void => {
    engine.emit('unit:created', unit);
  };
