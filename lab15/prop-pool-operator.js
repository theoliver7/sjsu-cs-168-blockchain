"use strict";

const { Miner, Blockchain } = require('spartan-gold');
const PoolMiner = require('./pool-miner');
const PoolOperator = require("./pool-operator");

const NEW_POOL_BLOCK = "NEW_POOL_BLOCK";
const SHARE_FOUND = "SHARE_FOUND";

const SHARE_REWARD = 2;

module.exports = class PropPoolOperator extends PoolOperator {

    constructor(...args) {
        super(...args);
        this.pendingAddresses = [];

    }


    rewardMiner(minerAddress) {
        this.pendingAddresses.push(minerAddress)
    }

    payRewards() {
        //pay ourself
        let payOut = this.currentBlock.coinbaseReward - 5
        let payOutPerShare = Math.floor(payOut / this.pendingAddresses.length)
        let remainder = Math.floor(payOut%this.pendingAddresses.length)
        this.pendingAddresses.forEach(address => {
            this.postTransaction([{address: this.pendingAddresses[address], amount: payOutPerShare}], 0);
        })
        this.postTransaction([{address: this.address, amount: 5+remainder}], 0);

        this.pendingAddresses = []
    }
}