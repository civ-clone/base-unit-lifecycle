import {
  activeUnits,
  hasActiveUnits,
  hasInactiveUnits,
  inactiveUnits,
} from '../lib/playerAction';
import {
  applyVisibility,
  emitCreated,
  registerUnit,
  setMoves,
} from '../lib/created';
import {
  carriesCargo,
  countLoss,
  deactivate,
  destroyedByAnother,
  emitDestroyed,
  isAboard,
  leaveOwnTransport,
  leaveTransport,
  loseCargo,
  notYetDestroyed,
  removeImprovements,
} from '../lib/destroyed';
import { carriesDomain, carriesUnit } from '../lib/canStow';
import {
  clearBusy,
  hasImprovement,
  hasMoves,
  isBusy,
  removeImprovement,
  setActive,
} from '../lib/activate';
import { countLosses, emitLostAtSea, sink } from '../lib/lostAtSea';
import {
  defended,
  destroyStack,
  emitAndDestroy,
  hasStack,
  notInCity,
} from '../lib/defeated';
import { fromLand, impassable, toPartnersLand } from '../lib/impassable';
import {
  hasMovesFor,
  shortOfMovesFor,
  spendMoves,
  spendShort,
} from '../lib/validateMove';
import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import Engine from '@civ-clone/core-engine/Engine';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Sleep from '@civ-clone/base-unit-action-sleep/Sleep';
import Stowed from '@civ-clone/base-unit-action-embark/Busy/Stowed';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import { Water } from '@civ-clone/core-terrain/Types';
import { emitHalted } from '../lib/halted';
import { emitUnsupported } from '../lib/unsupported';
import { expect } from 'chai';
import { sleepAboard } from '../lib/stowed';

// Stand-ins: only the parts of a unit, a tile and the registries each function asks for.

class LandDomain extends Unit {}
class AirDomain extends Unit {}
class Sea extends Water {}
class Fortification extends UnitImprovement {}
class Veterancy extends UnitImprovement {}

const moves = (value: number) => {
    let current = value;

    return {
      value: (): number => current,
      set: (to: number): void => {
        current = to;
      },
      subtract: (by: number): void => {
        current -= by;
      },
    };
  },
  standIn = (fields: { [key: string]: any } = {}, Type: typeof Unit = Unit) =>
    Object.assign(Object.create(Type.prototype), fields) as Unit,
  emitted = (engine: Engine, event: string): any[][] => {
    const calls: any[][] = [];

    engine.on(event, (...args: any[]) => calls.push(args));

    return calls;
  };

describe('created', (): void => {
  it('registers the unit', (): void => {
    const registered: Unit[] = [],
      unit = standIn();

    registerUnit({ register: (u: Unit) => registered.push(u) } as any)(unit);

    expect(registered).to.eql([unit]);
  });

  it('applies the visibility and sets full moves', (): void => {
    let applied = 0;
    const unitMoves = moves(0),
      unit = standIn({
        applyVisibility: () => applied++,
        moves: () => unitMoves,
        movement: () => 3,
      });

    applyVisibility(unit);
    setMoves(unit);

    expect(applied).to.equal(1);
    expect(unitMoves.value()).to.equal(3);
  });

  it('emits unit:created', (): void => {
    const engine = new Engine(),
      calls = emitted(engine, 'unit:created'),
      unit = standIn();

    emitCreated(engine)(unit);

    expect(calls).to.eql([[unit]]);
  });
});

describe('activate', (): void => {
  it('asks moves and busy, and activates and clears busy', (): void => {
    const calls: any[] = [],
      unit = standIn({
        moves: () => moves(1),
        busy: () => null,
        setActive: (...args: any[]) => calls.push(['active', ...args]),
        setBusy: (...args: any[]) => calls.push(['busy', ...args]),
      });

    expect(hasMoves(unit)).to.true;
    expect(hasMoves(standIn({ moves: () => moves(0) }))).to.false;
    expect(isBusy(unit)).to.false;
    expect(isBusy(standIn({ busy: () => ({}) }))).to.true;

    setActive(unit);
    clearBusy(unit);

    expect(calls).to.eql([['active'], ['busy']]);
  });

  it('removes only the improvements of the given type', (): void => {
    const unit = standIn(),
      fortified = new Fortification(),
      veteran = new Veterancy(),
      unregistered: UnitImprovement[] = [],
      registry = {
        getByUnit: (u: Unit) => (u === unit ? [veteran, fortified] : []),
        unregister: (...improvements: UnitImprovement[]) =>
          unregistered.push(...improvements),
      } as any;

    expect(hasImprovement(registry, Fortification)(unit)).to.true;
    expect(hasImprovement(registry, Fortification)(standIn())).to.false;

    removeImprovement(registry, Fortification)(unit);

    expect(unregistered).to.eql([fortified]);
  });
});

describe('validateMove', (): void => {
  it('spends the cost when there are moves enough', (): void => {
    const unitMoves = moves(3),
      unit = standIn({ moves: () => unitMoves });

    expect(hasMovesFor(unit, 3)).to.true;
    expect(hasMovesFor(unit, 4)).to.false;
    expect(shortOfMovesFor(unit, 3)).to.false;
    expect(shortOfMovesFor(unit, 4)).to.true;
    expect(spendMoves(unit, 2)).to.true;
    expect(unitMoves.value()).to.equal(1);
  });

  it('spends all that is left on a short step, and draws once to see if it gets there', (): void => {
    const draws: number[] = [],
      rng = (value: number) => () => {
        draws.push(value);

        return value;
      };

    // 1 of 3 left, factor 0.5: gets there when 1 >= 3 * 0.5 * draw, so a draw up to 2/3.
    [
      [0.6, true],
      [0.7, false],
    ].forEach(([draw, expected]) => {
      const unitMoves = moves(1),
        unit = standIn({ moves: () => unitMoves });

      expect(spendShort(0.5, rng(draw as number))(unit, 3)).to.equal(expected);
      expect(unitMoves.value()).to.equal(0);
    });

    expect(draws).to.eql([0.6, 0.7]);
  });

  it('always gets there with at least the factor of the cost left, and still draws', (): void => {
    let draws = 0;
    const unit = standIn({ moves: () => moves(2) });

    expect(
      spendShort(0.5, () => {
        draws++;

        return 0.999;
      })(unit, 4)
    ).to.true;
    expect(draws).to.equal(1);
  });
});

describe('impassable', (): void => {
  it('asks the step to start on land and the destination to be a partner’s', (): void => {
    const unit = standIn(),
      land = { isLand: () => true } as any,
      sea = { isLand: () => false } as any,
      partner = {} as any,
      asked: any[] = [];

    expect(fromLand(unit, sea, land)).to.true;
    expect(fromLand(unit, land, sea)).to.false;
    expect(
      toPartnersLand((u, t) => {
        asked.push([u, t]);

        return partner;
      })(unit, land)
    ).to.true;
    expect(toPartnersLand(() => null)(unit, land)).to.false;
    expect(asked).to.eql([[unit, land]]);
    expect(impassable()).to.true;
  });
});

describe('canStow', (): void => {
  const transportCarrying = (...carries: Carries[]) =>
    standIn({
      traits: (Trait: any) => (Trait === Carries ? carries : []),
    }) as any;

  it('matches only the domain the transport is declared to carry', (): void => {
    const ship = transportCarrying(new Carries(LandDomain)),
      land = standIn({}, LandDomain),
      air = standIn({}, AirDomain);

    expect(carriesDomain(LandDomain)(ship)).to.true;
    expect(carriesDomain(AirDomain)(ship)).to.false;
    expect(carriesUnit(LandDomain)(ship, land)).to.true;
    expect(carriesUnit(LandDomain)(ship, air)).to.false;
    expect(carriesUnit(AirDomain)(ship, air)).to.false;
  });

  it('asks each Carries trait for its own domain only', (): void => {
    const twoDomains = transportCarrying(
        new Carries(LandDomain),
        new Carries(AirDomain)
      ),
      air = standIn({}, AirDomain);

    expect(carriesUnit(AirDomain)(twoDomains, air)).to.true;
    expect(carriesUnit(LandDomain)(twoDomains, air)).to.false;
  });
});

describe('stowed', (): void => {
  it('puts the unit to sleep where it is, and returns what action returns', (): void => {
    const tile = {} as any,
      performed: any[] = [],
      unit = standIn({
        tile: () => tile,
        action: (action: any) => {
          performed.push(action);

          return 'result';
        },
      });

    expect(sleepAboard(unit)).to.equal('result');
    expect(performed).to.have.length(1);
    expect(performed[0]).to.instanceOf(Sleep);
    expect(performed[0].from()).to.equal(tile);
    expect(performed[0].to()).to.equal(tile);
    expect(performed[0].unit()).to.equal(unit);
  });
});

describe('halted and unsupported', (): void => {
  it('emits unit:halted and unit:unsupported with their arguments', (): void => {
    const engine = new Engine(),
      halted = emitted(engine, 'unit:halted'),
      unsupported = emitted(engine, 'unit:unsupported'),
      unit = standIn(),
      tile = {} as any,
      city = {} as any;

    emitHalted(engine)(unit, tile);
    emitUnsupported(engine)(city, unit);

    expect(halted).to.eql([[unit, tile]]);
    expect(unsupported).to.eql([[city, unit]]);
  });
});

describe('defeated', (): void => {
  const setUp = () => {
    const engine = new Engine(),
      ruleRegistry = new RuleRegistry(),
      destroyed: any[][] = [];

    ruleRegistry.register(
      new Destroyed(
        new Effect((unit: Unit, player: any): void => {
          destroyed.push([unit, player]);
        })
      )
    );

    return { engine, ruleRegistry, destroyed };
  };

  it('emits unit:defeated, then destroys the unit for the winner’s player', (): void => {
    const { engine, ruleRegistry, destroyed } = setUp(),
      calls = emitted(engine, 'unit:defeated'),
      winner = {} as any,
      unit = standIn(),
      by = standIn({ player: () => winner }),
      action = {} as any,
      order: string[] = [];

    engine.on('unit:defeated', () => order.push('emit'));
    ruleRegistry.register(
      new Destroyed(new Effect(() => order.push('destroy')))
    );

    emitAndDestroy(engine, ruleRegistry)(unit, by, action);

    expect(calls).to.eql([[unit, by, action]]);
    expect(destroyed).to.eql([[unit, winner]]);
    expect(order).to.eql(['emit', 'destroy']);
  });

  it('tells a defeated defender from a defeated attacker', (): void => {
    const unit = standIn(),
      by = standIn();

    expect(defended(unit, by)).to.true;
    expect(defended(unit, by, { unit: () => by } as any)).to.true;
    expect(defended(unit, by, { unit: () => unit } as any)).to.false;
  });

  it('asks for a city on the tile', (): void => {
    const tile = {},
      unit = standIn({ tile: () => tile }),
      cities = (city: any) => ({
        getByTile: (t: any) => (t === tile ? city : 'x'),
      });

    expect(notInCity(cities(null) as any)(unit)).to.true;
    expect(notInCity(cities({}) as any)(unit)).to.false;
  });

  it('destroys the rest of the player’s stack, and nobody else’s', (): void => {
    const { ruleRegistry, destroyed } = setUp(),
      tile = {},
      mine = {} as any,
      theirs = {} as any,
      winner = {} as any,
      unit = standIn({ tile: () => tile, player: () => mine }),
      friend = standIn({ player: () => mine }),
      other = standIn({ player: () => theirs }),
      units = (onTile: Unit[]) =>
        ({ getByTile: (t: any) => (t === tile ? onTile : []) } as any),
      by = standIn({ player: () => winner });

    expect(hasStack(units([unit, friend, other]))(unit)).to.true;
    expect(hasStack(units([unit, other]))(unit)).to.false;

    destroyStack(units([friend, unit, other, friend]), ruleRegistry)(unit, by);

    expect(destroyed).to.eql([
      [friend, winner],
      [friend, winner],
    ]);
  });
});

describe('destroyed', (): void => {
  const transports = (manifests: any[]) => {
    const registry = {
      unregistered: [] as any[],
      getByTransport: (transport: any) =>
        manifests.filter((manifest) => manifest.transport() === transport),
      getByUnit: (unit: any) =>
        manifests.find((manifest) => manifest.unit() === unit),
      hasUnit: (unit: any) =>
        manifests.some((manifest) => manifest.unit() === unit),
      unregister: (manifest: any) => {
        registry.unregistered.push(manifest);
        manifests.splice(manifests.indexOf(manifest), 1);
      },
    };

    return registry;
  };

  const cargoUnit = (busy: any = null) => {
    const unit = standIn({
      busy: () => busy,
      setBusy: (value: any = null) => {
        busy = value;
      },
      destroyed: () => (unit as any).lost.length > 0,
      destroy: (player: any) => (unit as any).lost.push(player),
      lost: [] as any[],
    });

    return unit;
  };

  it('emits unit:destroyed and asks who destroyed it', (): void => {
    const engine = new Engine(),
      calls = emitted(engine, 'unit:destroyed'),
      mine = {} as any,
      theirs = {} as any,
      unit = standIn({ player: () => mine });

    emitDestroyed(engine)(unit, theirs);

    expect(calls).to.eql([[unit, theirs]]);
    expect(destroyedByAnother(unit, theirs)).to.true;
    expect(destroyedByAnother(unit, mine)).to.false;
    expect(destroyedByAnother(unit, null)).to.false;
  });

  it('counts a loss once, by type, and then deactivates', (): void => {
    const recorded: any[] = [],
      calls: any[] = [],
      player = {},
      unit = standIn({
        player: () => player,
        sourceClass: () => LandDomain,
        destroyed: () => calls.includes('destroyed'),
        setActive: (active: boolean) => calls.push(['active', active]),
        setDestroyed: () => calls.push('destroyed'),
      });

    expect(notYetDestroyed(unit)).to.true;

    countLoss({
      record: (...args: any[]) => recorded.push(args),
    } as any)(unit);
    deactivate(unit);

    expect(recorded).to.eql([[player, LandDomain]]);
    expect(calls).to.eql([['active', false], 'destroyed']);
    expect(notYetDestroyed(unit)).to.false;
  });

  it('removes every improvement', (): void => {
    const unit = standIn(),
      improvements = [new Fortification(), new Veterancy()],
      unregistered: any[] = [];

    removeImprovements({
      getByUnit: (u: Unit) => (u === unit ? improvements : []),
      unregister: (improvement: any) => unregistered.push(improvement),
    } as any)(unit);

    expect(unregistered).to.eql(improvements);
  });

  it('takes a unit off its transport and clears Stowed, and only Stowed', (): void => {
    const stowed = cargoUnit(new Stowed()),
      sleeping = {},
      other = cargoUnit(sleeping),
      ship = standIn(),
      manifests = [
        { unit: () => stowed, transport: () => ship },
        { unit: () => other, transport: () => ship },
      ],
      registry = transports(manifests.slice());

    manifests.forEach((manifest) =>
      leaveTransport(registry as any)(manifest as any)
    );

    expect(registry.unregistered).to.eql(manifests);
    expect(stowed.busy()).to.null;
    expect(other.busy()).to.equal(sleeping);
  });

  it('loses the cargo of a transport at sea, destroyed by the same player', (): void => {
    const player = {},
      sea = { terrain: () => new Sea() },
      ship = standIn({ tile: () => sea }),
      first = cargoUnit(new Stowed()),
      second = cargoUnit(new Stowed()),
      registry = transports([
        { unit: () => first, transport: () => ship },
        { unit: () => second, transport: () => ship },
      ]);

    expect(carriesCargo(registry as any)(ship)).to.true;

    loseCargo(registry as any)(ship, player as any);

    expect(registry.unregistered).to.have.length(2);
    expect(first.busy()).to.null;
    expect((first as any).lost).to.eql([player]);
    expect((second as any).lost).to.eql([player]);
    expect(carriesCargo(registry as any)(ship)).to.false;
  });

  it('leaves the cargo of a transport in port, and doesn’t destroy cargo already destroyed', (): void => {
    const port = { terrain: () => ({}) },
      sea = { terrain: () => new Sea() },
      inPort = standIn({ tile: () => port }),
      atSea = standIn({ tile: () => sea }),
      safe = cargoUnit(),
      gone = cargoUnit(),
      registry = transports([
        { unit: () => safe, transport: () => inPort },
        { unit: () => gone, transport: () => atSea },
      ]);

    (gone as any).lost.push('earlier');

    loseCargo(registry as any)(inPort, null);
    loseCargo(registry as any)(atSea, null);

    expect((safe as any).lost).to.eql([]);
    expect((gone as any).lost).to.eql(['earlier']);
    expect(registry.unregistered).to.have.length(2);
  });

  it('takes cargo destroyed on its own off its transport', (): void => {
    const ship = standIn(),
      cargo = cargoUnit(new Stowed()),
      ashore = cargoUnit(),
      manifest = { unit: () => cargo, transport: () => ship },
      registry = transports([manifest]);

    expect(isAboard(registry as any)(cargo)).to.true;
    expect(isAboard(registry as any)(ashore)).to.false;

    leaveOwnTransport(registry as any)(cargo);

    expect(registry.unregistered).to.eql([manifest]);
    expect(cargo.busy()).to.null;
  });
});

describe('lostAtSea', (): void => {
  it('emits, counts the transport and its cargo not yet destroyed, then sinks it by no one', (): void => {
    const engine = new Engine(),
      calls = emitted(engine, 'unit:lost-at-sea'),
      player = {},
      recorded: any[] = [],
      sunk: any[] = [],
      ship = standIn({
        player: () => player,
        sourceClass: () => AirDomain,
        destroyed: () => false,
        destroy: (by: any) => sunk.push(by),
      }),
      aboard = standIn({
        player: () => player,
        sourceClass: () => LandDomain,
        destroyed: () => false,
      }),
      gone = standIn({ destroyed: () => true }),
      registry = {
        getByTransport: (transport: any) =>
          transport === ship
            ? [{ unit: () => aboard }, { unit: () => gone }]
            : [],
      };

    emitLostAtSea(engine)(ship as any);
    countLosses(
      { record: (...args: any[]) => recorded.push(args) } as any,
      registry as any
    )(ship as any);
    sink(ship as any);

    expect(calls).to.eql([[ship]]);
    expect(recorded).to.eql([
      [player, AirDomain],
      [player, LandDomain],
    ]);
    expect(sunk).to.eql([null]);
  });
});

describe('playerAction', (): void => {
  class Active extends PlayerAction<Unit> {}
  class Inactive extends PlayerAction<Unit> {}

  const player = {} as any,
    unit = (active: boolean, left: number, waiting = false) =>
      standIn({
        active: () => active,
        moves: () => moves(left),
        waiting: () => waiting,
      }),
    waitingActive = unit(true, 1, true),
    active = unit(true, 1),
    spent = unit(true, 0),
    waitingAsleep = unit(false, 1, true),
    asleep = unit(false, 1),
    registry = (units: Unit[]) =>
      ({ getByPlayer: (p: any) => (p === player ? units : []) } as any);

  it('lists active units with moves, waiting units last', (): void => {
    const units = registry([waitingActive, spent, active, asleep]),
      actions = activeUnits(units, Active)(player);

    expect(hasActiveUnits(units)(player)).to.true;
    expect(hasActiveUnits(registry([spent, asleep]))(player)).to.false;
    expect(actions.map((action) => action.value())).to.eql([
      active,
      waitingActive,
    ]);
    actions.forEach((action) => {
      expect(action).to.instanceOf(Active);
      expect(action.player()).to.equal(player);
    });
  });

  it('lists inactive units and those without moves, waiting units last', (): void => {
    const units = registry([waitingAsleep, active, spent, asleep]),
      actions = inactiveUnits(units, Inactive)(player);

    expect(hasInactiveUnits(units)(player)).to.true;
    expect(hasInactiveUnits(registry([active]))(player)).to.false;
    expect(actions.map((action) => action.value())).to.eql([
      spent,
      asleep,
      waitingAsleep,
    ]);
    actions.forEach((action) => expect(action).to.instanceOf(Inactive));
  });
});
