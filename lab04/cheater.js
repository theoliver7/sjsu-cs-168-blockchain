"use strict";

let Player = require('./player.js').Player;
let net = require('./fakeNet.js');

const SHARE = "SHARE_NUMBER";

class Lottery {
    constructor(players) {
        this.players = players;
        let i = 0;
        this.players.forEach(p => {
            net.registerMiner(p);
            p.id = i++;
            p.numPlayers = this.players.length;
            p.game = this;
        });
    }

    play() {
        this.players.forEach(p => {
            p.share();
        });
    }

    getPlayerName(i) {
        return this.players[i].name;
    }
}


let a = new Player('Alice');
let b = new Player('Bob');
let c = new Player('Charlie');

// Trudy is a cheater.
let t = new Player('Trudy');

// Trudy does NOT broadcast her number initially.
t.share = function () {
};

// Trudy disables the old listener
t.removeListener(SHARE, t.handleShare);

// Trudy waits until everyone else has announced their choice.
// Then she chooses a number that will make her the winner.
t.handleShare = function (o) {
    //
    // ***YOUR CODE HERE***
    //
    // Update this listener code so that Trudy chooses her "random" share
    // so that she will always be selected as the winner.
    this.shares[o.id] = o.number;
    if (this.shares.length === this.numPlayers - 1) {
        let sum = this.shares.reduce((a, b) => a + b)
        let winner = sum % this.numPlayers
        if (this.game.getPlayerName(winner) === 'Trudy') {
            net.broadcast(SHARE, {id: this.id, number: 0});
        } else {
            let diff = this.id - winner
            net.broadcast(SHARE, {id: this.id, number: diff});
        }
    }
};

t.on(SHARE, t.handleShare);

let game = new Lottery([a, b, c, t]);
game.play();

