"use strict";

const utils = require('./utils.js');

class Prover {
    constructor(numLeadingZeroes) {
        this.numLeadingZeroes = numLeadingZeroes;
    }

    verifyProof(s, proof) {
        //
        // ***YOUR CODE HERE***
        //
        let hashToCheck = utils.hash(s + proof);
        let zerosCnt = 0

        for (let c of hashToCheck) {
            switch (c) {
                case '0':
                    zerosCnt += 4;
                    break;
                case '1':
                    zerosCnt += 3;
                    break;
                case '2':
                    zerosCnt += 2;
                    break;
                case '3':
                    zerosCnt += 2;
                    break;
                case '4':
                    zerosCnt += 1;
                    break;
                case '5':
                    zerosCnt += 1;
                    break;
                case '6':
                    zerosCnt += 1;
                    break;
                case '7':
                    zerosCnt += 1;
                    break;
            }
            if (c !== '0') {
                break;
            }
        }
        return (zerosCnt === this.numLeadingZeroes);
    }

    findProof(s) {
        //
        // ***YOUR CODE HERE***
        //
        let nonce = 0;
        while (!this.verifyProof(s, nonce)) {
            nonce++;
        }
        return nonce;
    }
}

exports.Prover = Prover;



