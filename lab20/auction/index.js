"use strict";

let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
let account;
web3.eth.getAccounts().then((f) => {
    account = f[0];
});

// Load the ABI produced by the compiler
let abi = JSON.parse('[{"inputs":[],"name":"getHighBidder","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTopBid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"name","type":"bytes32"},{"internalType":"uint256","name":"bid","type":"uint256"}],"name":"makeBid","outputs":[],"stateMutability":"nonpayable","type":"function"}]');

// Load the contract.
let contract = new web3.eth.Contract(abi);
contract.options.address = "0xc8ed885f4463439c2183C3110B9AEc5A950b1ec9";



function updateResults() {
    // ***YOUR CODE HERE***
    contract.methods.getTopBid().call((_, bids) => {
        $("highBid").val("The current high bid is" + bids);
    });
}

// Load initial results upon loading.
updateResults();

