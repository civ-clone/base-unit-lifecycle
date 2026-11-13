"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carriesUnit = exports.carriesDomain = void 0;
const Carries_1 = require("@civ-clone/base-unit-trait-carries/Carries");
// What a ruleset's `CanStow` rules ask, one rule for each domain (`Land`, `Air`...) a transport may be declared to
//  carry: what a transport carries is its `Carries` traits.
// The transport is declared to carry units of `Domain`.
const carriesDomain = (Domain) => (transport) => transport
    .traits(Carries_1.default)
    .some((carries) => carries.what === Domain);
exports.carriesDomain = carriesDomain;
// The transport carries `unit` as one of `Domain`: a `Carries` trait for `Domain` that accepts it.
const carriesUnit = (Domain) => (transport, unit) => transport
    .traits(Carries_1.default)
    .some((carries) => carries.what === Domain && carries.carries(unit));
exports.carriesUnit = carriesUnit;
//# sourceMappingURL=canStow.js.map