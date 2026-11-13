import Carries from '@civ-clone/base-unit-trait-carries/Carries';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import Unit from '@civ-clone/core-unit/Unit';

// What a ruleset's `CanStow` rules ask, one rule for each domain (`Land`, `Air`...) a transport may be declared to
//  carry: what a transport carries is its `Carries` traits.

// The transport is declared to carry units of `Domain`.
export const carriesDomain =
  (Domain: typeof Unit) =>
  (transport: ITransport): boolean =>
    (transport as unknown as Unit)
      .traits(Carries)
      .some((carries: Carries): boolean => carries.what === Domain);

// The transport carries `unit` as one of `Domain`: a `Carries` trait for `Domain` that accepts it.
export const carriesUnit =
  (Domain: typeof Unit) =>
  (transport: ITransport, unit: Unit): boolean =>
    (transport as unknown as Unit)
      .traits(Carries)
      .some(
        (carries: Carries): boolean =>
          carries.what === Domain && carries.carries(unit)
      );
