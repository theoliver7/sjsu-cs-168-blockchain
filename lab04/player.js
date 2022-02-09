"use strict";

let EventEmitter = require('events');
let crypto = require('crypto');

let net = require('./fakeNet.js');
let rand = require('./rand');

const SHARE = "SHARE_NUMBER";
const COMMIT = "COMMIT";
const HASH_ALG = 'sha256';
// Player for lottery game
class Player extends EventEmitter {

    constructor(name) {
        super();
        this.name = name;

        // Every player tracks its own share and the
        // shares of all other players.
        this.shares = [];
        this.hashes = []

        this.on(SHARE, this.handleShare);
        this.on(COMMIT, this.handleCommit)
    }

    // Broadcast the player's share to all other players.
    share() {
        net.broadcast(SHARE, {id: this.id, number: this.number});
    }

    // Receive incoming share from another player.
    handleShare(o) {
        this.shares[o.id] = o.number;
        let keys = Object.keys(this.shares);
        if (keys.length === this.numPlayers) {
            this.determineWinner();
        }
    }

    // Once all the shares are in, calculate the winner
    // from all of the random numbers received.
    determineWinner() {
        let sum = 0;
        this.shares.forEach((share) => {
            sum += share;
        });
        let winnerID = sum % this.numPlayers;
        let winnerName = this.game.getPlayerName(winnerID);
        console.log(`${this.name} announces ${winnerName} as the winner`);
    }

    commit() {
        this.number = rand.nextInt(this.numPlayers);
        let hash = crypto.createHash(HASH_ALG).update(""+this.number).digest('hex')
        net.broadcast(COMMIT, {id: this.id, number: hash});
    }
    handleCommit(o){
        this.hashes[o.id] = o.number;
        if (this.hashes.length === this.numPlayers) {
            this.share();
        }
    }
}

exports.Player = Player;


