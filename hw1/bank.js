"use strict";

const blindSignatures = require('blind-signatures');

const {Coin, COIN_RIS_LENGTH, IDENT_STR, BANK_STR, NUM_COINS_REQUIRED} = require('./coin.js');
const utils = require('./utils.js');

// This class represents a bank issuing DigiCash-lite coins.
class Bank {
    constructor() {
        this.key = blindSignatures.keyGeneration({b: 2048});
        this.ledger = {};
        this.coinDB = {}; // tracks previously redeemed coins
    }

    // Returns the modulus used for digital signatures.
    get n() {
        return this.key.keyPair.n.toString();
    }

    // Returns the e value used for digital signatures.
    get e() {
        return this.key.keyPair.e.toString();
    }

    // Prints out the balances for all of the bank's customers.
    showBalances() {
        console.log(JSON.stringify(this.ledger));
    }

    // Initializes a client's account with 0 value.
    registerClient(client) {
        this.ledger[client.name] = 0;
    }

    // Updates the ledger to account for money submitted directly to the bank.
    deposit({account, amount}) {
        if (this.ledger[account] === undefined) {
            throw new Error(`${account} is not a registered customer of the bank`);
        }
        this.ledger[account] += amount;
    }

    // Updates the ledger to account for money withdrawn directly from the bank.
    withdraw({account, amount}) {
        if (this.ledger[account] === undefined) {
            throw new Error(`${account} is not a registered customer of the bank`);
        }
        if (this.ledger[account] < amount) {
            throw new Error("Insufficient funds");
        }
        this.ledger[account] -= amount;
    }

    // Returns the balance for the specified account.
    balance(account) {
        if (this.ledger[account] === undefined) {
            throw new Error(`${account} is not a registered customer of the bank`);
        }
        return this.ledger[account];
    }

    // Transfers money between 2 of the bank's customers.
    transfer({from, to, amount}) {
        if (this.ledger[from] === undefined) {
            throw new Error(`${from} is not a registered customer of the bank`);
        }
        if (this.ledger[to] === undefined) {
            throw new Error(`${to} is not a registered customer of the bank`);
        }
        let fromBalance = this.ledger[from];
        if (fromBalance < amount) {
            throw new Error(`${from} does not have sufficient funds`);
        }
        this.ledger[from] = fromBalance - amount;
        this.ledger[to] += amount;
    }

    // Verifies that a bank customer has sufficient funds for a transaction.
    verifyFunds({account, amount}) {
        if (this.ledger[account] === undefined) {
            throw new Error(`${account} is not a registered customer of the bank`);
        }
        let balance = this.ledger[account];
        return balance >= amount;
    }

    // This method represents the bank's side of the exchange when a user buys a coin.
    sellCoin(account, amount, coinBlindedHashes, response) {
        //
        //  ***YOUR CODE HERE***
        //
        if (coinBlindedHashes.length !== NUM_COINS_REQUIRED) {
            throw new Error("wrong number of coins supplied")
        }
        let selected = utils.randInt(coinBlindedHashes.length);
        // console.log(`Bank selected ${selected}`);
        let [blindingFactors, coins] = response(selected)

        let blindingFactorsCopy = blindingFactors.slice()
        let coinsCopy = coins.slice()

        blindingFactorsCopy[selected] = undefined
        coinsCopy[selected] = undefined

        coins.forEach((coin, i) => {
            if (coin === undefined) return;
            if (!coin.verifyUnblinded(blindingFactorsCopy[i])) {
                throw new Error(`Coin ${i} is invalid`);
            }

            for (let y = 0; y < COIN_RIS_LENGTH; y++) {
                let identity = utils.decryptOTP({
                    key: coin.rightIdent[y],
                    ciphertext: coin.leftIdent[y],
                    returnType: "string",
                });

                if (!identity.startsWith("IDENT")) {
                    throw new Error("can't verify identity");
                }
            }
        });

        this.withdraw({account: account, amount: amount})

        return blindSignatures.sign({
            blinded: coinBlindedHashes[selected],
            key: this.key,
        });

    }

    // Adds a coin to a user's bank account.
    redeemCoin({account, coin, ris}) {
        //
        //  ***YOUR CODE HERE***
        //

        let coinString = coin.toString()

        let valid = blindSignatures.verify({
            unblinded: coin.signature,
            N: coin.n,
            E: coin.e,
            message: coinString,
        });
        if (!valid){ throw new Error("Invalid Signature")}

        if (this.coinDB[coin.guid] === undefined) {
            this.deposit({account: account, amount: coin.amount})
            this.coinDB[coin.guid] = ris
            console.log(`Coin #${coin.guid} has been redeemed.  Have a nice day.`);
        } else {
            let doubleSpending = false
            console.log(`Coin ${coin.guid} previously spent.  Determining cheater.`);
            for (let i = 0; i < ris.length; i++) {
                let xor = utils.decryptOTP({
                    key: ris[i],
                    ciphertext: this.coinDB[coin.guid][i],
                    returnType: "string"
                });

                if (xor.startsWith(IDENT_STR)) {
                    doubleSpending = true
                    let cheater = xor.split(':')[1];
                    console.log(`${cheater} double spent coin ${coin.guid}.`);
                    break;
                }
            }
            if(!doubleSpending){console.log("The merchant tried to redeem the coin twice");}
            console.log(`Sorry, but coin #${coin.guid} cannot be accepted.`);
        }
    }
}

exports.Bank = Bank;

