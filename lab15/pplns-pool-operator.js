"use strict";

const { Miner, Blockchain } = require('spartan-gold');
const PoolMiner = require('./pool-miner');
const PoolOperator = require("./pool-operator");

const NEW_POOL_BLOCK = "NEW_POOL_BLOCK";
const SHARE_FOUND = "SHARE_FOUND";

const SHARE_REWARD = 4;

module.exports = class PropPoolOperator extends PoolOperator {

    constructor({name, net, startingBlock, keyPair, miningRounds, poolNet} = {}) {
        super({name, net, startingBlock, keyPair, miningRounds, poolNet});

        this.poolNet = poolNet;

        // Copying hasValidShare method from PoolMiner class.
        this.hasValidShare = PoolMiner.prototype.hasValidShare;
        // Storing transactions for next block.
        this.transactions = new Set();
        this.on(SHARE_FOUND, this.receiveShare);

        this.storedAddresses = [];
        this.newAddressIndex = 0;

    }

    rewardMiner(minerAddress) {
        this.storedAddresses[this.newAddressIndex]= minerAddress
        this.newAddressIndex = (this.newAddressIndex++)%5
    }

    payRewards() {
        //pay ourself
        let operatorReward = this.currentBlock.coinbaseReward - (this.storedAddresses*4)
        this.storedAddresses.forEach(address => {
            this.postTransaction([{address: address, amount: SHARE_REWARD}], 0);
        })
        this.postTransaction([{address: this.address, amount: operatorReward}], 0);
    }
}