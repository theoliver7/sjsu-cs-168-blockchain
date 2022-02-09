"use strict";

let crypto = require('crypto');

const MAX_RANGE = 256;

// Returns a random number between 0 and 255.
function sample() {
    return crypto.randomBytes(1).readUInt8();
}

exports.nextInt = function (range) {
    if (range > MAX_RANGE) {
        throw new Error(`Sorry, range cannot be more than ${MAX_RANGE}`);
    }

    return sample() % range;
}
//rejection sampling - discard random numbers out of range
exports.nextInt2 = function (range) {
    if (range > MAX_RANGE) {
        throw new Error(`Sorry, range cannot be more than ${MAX_RANGE}`);
    }
    let result = sample()
    while (result > range) {
        result = sample()
    }
    return result;
}

//improved rejection sampling - use as much of the space without the bias
exports.nextInt3 = function (range) {
    if (range > MAX_RANGE) {
        throw new Error(`Sorry, range cannot be more than ${MAX_RANGE}`);
    }
    let result = sample()
    let ur = Math.floor(MAX_RANGE / range)*range
    while (result > ur) {
        result = sample()
    }
    return result % range;
}
