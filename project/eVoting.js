"use strict";

const fs = require('fs');
const Web3 = require('web3');

// Default parameters for calling Ethereum
const GAS = 1500000;
const GAS_PRICE_IN_ETH = '0.00003';
const URL = "http://localhost:8545";
const CONTRACT_NAME = "eVoting_sol_eVoting";

module.exports = class EVoting {

    /**
     * The constructor for the SpartanPyrite interface.  If the contract has been
     * deployed previously, the address can be specified.
     *
     * @constructor
     * @param {Object} [config] - The configuration details of this interface.
     * @param {String} [config.contractAddress] - The address of a contract that has been deployed.
     * @param {String} [config.contractName] - The name of the bin/abi files, without extensions.
     * @param {String} [config.url] - The URL that Ganache is listening to.
     */
    constructor({contractAddress, contractName = CONTRACT_NAME, url = URL} = {}) {
        this.contractName = contractName
        this.url = url;
        this.web3 = new Web3(this.url);

        // If a contract address has been specified, the ABI file can be specified.
        // Otherwise, deploy needs to be called.
        if (contractAddress) {
            let abi = JSON.parse(fs.readFileSync(`${this.contractName}.abi`).toString());
            this.contract = new this.web3.eth.Contract(abi);
            this.contract.options.address = contractAddress;
        }
    }

    /**
     * Deploys the smart contract to Ganache.
     *
     * @param {String} from - The address paying to deploy the contract.
     * @param {Number} [gas] - The maximum amount of gas to spend deploying the contract.
     * @param {Number} [gasPrice] - The ETH paid per unit of gas.
     *
     * @returns {Promise}
     */
    deploy(from, gas = GAS, gasPrice = GAS_PRICE_IN_ETH, proposal) {
        let bytecode = fs.readFileSync(`${this.contractName}.bin`).toString();
        let abi = JSON.parse(fs.readFileSync(`${this.contractName}.abi`).toString());

        this.contract = new this.web3.eth.Contract(abi);

        // Deploying the contract -- this uses JS's promises API.
        // We assume that there are no arguments to the constructor.
        // If there are, you would need to pass them to the arguments
        // property of the object passed to 'deploy'.
        return this.contract.deploy({
            data: bytecode,
            arguments: [proposal]
        }).send({
            from: from,
            gas: gas,
            gasPrice: this.web3.utils.toWei(gasPrice, 'ether')
        }).then((newContractInstance) => {
            let contractAddress = newContractInstance.options.address;
            this.contract.options.address = contractAddress;
            console.log(`Contract address: ${contractAddress}`);
        });
    }

    /**
     * Calls the Ethereum smart contract to transfer SPYR tokens
     * to another account.  Note that the 'from' address pays for
     * the transaction.
     *
     * @param {String} from - Ethereum address sending the tokens.
     * @param {String} to - Ethereum address receiving the tokens.
     * @param {Number} amt - Amount of tokens being transferred.
     *
     * @returns {Promise}
     */
    transfer(from, to, amt) {
        return this.contract.methods.addVoter(to, amt).send({
            from: from,
        });
    }
}