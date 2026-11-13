"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleepAboard = void 0;
const Sleep_1 = require("@civ-clone/base-unit-action-sleep/Sleep");
// A unit that has just boarded a transport sleeps aboard it. Returns what `unit.action` returns.
const sleepAboard = (unit) => unit.action(new Sleep_1.default(unit.tile(), unit.tile(), unit));
exports.sleepAboard = sleepAboard;
//# sourceMappingURL=stowed.js.map