let eVotingABI = [{"inputs":[{"internalType":"string","name":"_proposal","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"_voterAddress","type":"address"}],"name":"addVoter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"concludeVote","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"finalResult","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"state","outputs":[{"internalType":"enum eVoting.VotingState","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"_choice","type":"bool"}],"name":"submitVote","outputs":[{"internalType":"bool","name":"voted","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalVote","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalVoter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"voterDirectory","outputs":[{"internalType":"address","name":"voterAddress","type":"address"},{"internalType":"bool","name":"voted","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"votingTopic","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]

let proposal = ""
let contractAddress = ""
let eVotingContract
let from

window.addEventListener('load', async () => {
    window.web3 = new Web3(window.ethereum);

    try {
        let address = await window.ethereum.request({method: 'eth_requestAccounts'});
        from = address[0]
        eVotingContract = new web3.eth.Contract(eVotingABI);
        eVotingByteCode = '6080604052600080556000600155600060025560006003553480156200002457600080fd5b50604051620011133803806200111383398181016040528101906200004a919062000326565b33600460006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508060059080519060200190620000a3929190620000d9565b506000600860006101000a81548160ff02191690836001811115620000cd57620000cc62000377565b5b0217905550506200040a565b828054620000e790620003d5565b90600052602060002090601f0160209004810192826200010b576000855562000157565b82601f106200012657805160ff191683800117855562000157565b8280016001018555821562000157579182015b828111156200015657825182559160200191906001019062000139565b5b5090506200016691906200016a565b5090565b5b80821115620001855760008160009055506001016200016b565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620001f282620001a7565b810181811067ffffffffffffffff82111715620002145762000213620001b8565b5b80604052505050565b60006200022962000189565b9050620002378282620001e7565b919050565b600067ffffffffffffffff8211156200025a5762000259620001b8565b5b6200026582620001a7565b9050602081019050919050565b60005b838110156200029257808201518184015260208101905062000275565b83811115620002a2576000848401525b50505050565b6000620002bf620002b9846200023c565b6200021d565b905082815260208101848484011115620002de57620002dd620001a2565b5b620002eb84828562000272565b509392505050565b600082601f8301126200030b576200030a6200019d565b5b81516200031d848260208601620002a8565b91505092915050565b6000602082840312156200033f576200033e62000193565b5b600082015167ffffffffffffffff81111562000360576200035f62000198565b5b6200036e84828501620002f3565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680620003ee57607f821691505b602082108103620004045762000403620003a6565b5b50919050565b610cf9806200041a6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c8063c9f98d5211610066578063c9f98d5214610125578063e8363e9914610156578063f1cea4c714610186578063f3a8286f146101a4578063f4ab9adf146101c25761009e565b80636332abc9146100a35780636e978fde146100c15780638da5cb5b146100cb57806398d55578146100e9578063c19d93fb14610107575b600080fd5b6100ab6101de565b6040516100b891906108a6565b60405180910390f35b6100c96101e4565b005b6100d36102b6565b6040516100e09190610902565b60405180910390f35b6100f16102dc565b6040516100fe91906109b6565b60405180910390f35b61010f61036a565b60405161011c9190610a4f565b60405180910390f35b61013f600480360381019061013a9190610a9b565b61037d565b60405161014d929190610ae3565b60405180910390f35b610170600480360381019061016b9190610b38565b6103ce565b60405161017d9190610b65565b60405180910390f35b61018e61066a565b60405161019b91906108a6565b60405180910390f35b6101ac610670565b6040516101b991906108a6565b60405180910390f35b6101dc60048036038101906101d79190610a9b565b610676565b005b60025481565b60008060018111156101f9576101f86109d8565b5b600860009054906101000a900460ff16600181111561021b5761021a6109d8565b5b1461022557600080fd5b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461027f57600080fd5b6001600860006101000a81548160ff021916908360018111156102a5576102a46109d8565b5b021790555060005460018190555050565b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600580546102e990610baf565b80601f016020809104026020016040519081016040528092919081815260200182805461031590610baf565b80156103625780601f1061033757610100808354040283529160200191610362565b820191906000526020600020905b81548152906001019060200180831161034557829003601f168201915b505050505081565b600860009054906101000a900460ff1681565b60076020528060005260406000206000915090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060000160149054906101000a900460ff16905082565b6000808060018111156103e4576103e36109d8565b5b600860009054906101000a900460ff166001811115610406576104056109d8565b5b1461041057600080fd5b600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000160149054906101000a900460ff16156104a0576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161049790610c2c565b60405180910390fd5b600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000160149054906101000a900460ff1661065f576001600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000160146101000a81548160ff021916908315150217905550610557610829565b33816000019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508381602001901515908115158152505083156105bd576000808154809291906105b790610c7b565b91905055505b8060066000600354815260200190815260200160002060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160000160146101000a81548160ff0219169083151502179055509050506003600081548092919061065090610c7b565b91905055506001925050610664565b600091505b50919050565b60035481565b60015481565b600080600181111561068b5761068a6109d8565b5b600860009054906101000a900460ff1660018111156106ad576106ac6109d8565b5b146106b757600080fd5b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461071157600080fd5b61071961085b565b82816000019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff1681525050600081602001901515908115158152505080600760008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160000160146101000a81548160ff0219169083151502179055509050506002600081548092919061081f90610c7b565b9190505550505050565b6040518060400160405280600073ffffffffffffffffffffffffffffffffffffffff1681526020016000151581525090565b6040518060400160405280600073ffffffffffffffffffffffffffffffffffffffff1681526020016000151581525090565b6000819050919050565b6108a08161088d565b82525050565b60006020820190506108bb6000830184610897565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006108ec826108c1565b9050919050565b6108fc816108e1565b82525050565b600060208201905061091760008301846108f3565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561095757808201518184015260208101905061093c565b83811115610966576000848401525b50505050565b6000601f19601f8301169050919050565b60006109888261091d565b6109928185610928565b93506109a2818560208601610939565b6109ab8161096c565b840191505092915050565b600060208201905081810360008301526109d0818461097d565b905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b60028110610a1857610a176109d8565b5b50565b6000819050610a2982610a07565b919050565b6000610a3982610a1b565b9050919050565b610a4981610a2e565b82525050565b6000602082019050610a646000830184610a40565b92915050565b600080fd5b610a78816108e1565b8114610a8357600080fd5b50565b600081359050610a9581610a6f565b92915050565b600060208284031215610ab157610ab0610a6a565b5b6000610abf84828501610a86565b91505092915050565b60008115159050919050565b610add81610ac8565b82525050565b6000604082019050610af860008301856108f3565b610b056020830184610ad4565b9392505050565b610b1581610ac8565b8114610b2057600080fd5b50565b600081359050610b3281610b0c565b92915050565b600060208284031215610b4e57610b4d610a6a565b5b6000610b5c84828501610b23565b91505092915050565b6000602082019050610b7a6000830184610ad4565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610bc757607f821691505b602082108103610bda57610bd9610b80565b5b50919050565b7f6164647265737320616c726561647920766f7465640000000000000000000000600082015250565b6000610c16601583610928565b9150610c2182610be0565b602082019050919050565b60006020820190508181036000830152610c4581610c09565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610c868261088d565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203610cb857610cb7610c4c565b5b60018201905091905056fea2646970667358221220e87e5d38ed3a3194ea9b9b4eaa2da0764862ad3e70904497242fa7702fd984e564736f6c634300080d0033';
    } catch (error) {
        if (error.code === 4001) {
            //rejected
        }
        console.log(error)
    }
});

function loadVoteContract() {
    this.contractAddress = document.getElementById('contractAddress').value
    this.eVotingContract = new web3.eth.Contract(eVotingABI, this.contractAddress);
    this.eVotingContract.methods.votingTopic().call().then((result) => {
        console.log(result)
        this.proposal = result
        displayVote()
    });
}

function displayVote() {
    document.getElementById("voteForProposal").innerHTML =
        `Do you want to accept following proposal: ${this.proposal} <div class="pull-right" style = "margin-top:5px">
        <button type="button" class="btn btn-success" style="width: 200px" onclick="voteYes()">Yes</button>
        <button type="button" class="btn btn-danger" style="width: 200px" onclick="voteNo()">No</button></div>`;
}

function voteYes() {
    this.eVotingContract.methods.submitVote(true).send({
        from: from, gas: 1500000, gasPrice: this.web3.utils.toWei("0.000000003", 'ether')
    })
        .on('error', x => {
            if (x.message.includes("address already voted")) {
                window.alert("Error while voting. Address was already used")
            } else {
                window.alert("Error while voting")
            }
        }).then(x => {
        console.log(x)
    });

}

function voteNo() {
    this.eVotingContract.methods.submitVote(false).send({
        from: from, gas: 1500000, gasPrice: this.web3.utils.toWei("0.000000003", 'ether')
    })
        .on('error', x => {
            if (x.message.includes("address already voted")) {
                window.alert("Error while voting. Address was already used")
            } else {
                window.alert("Error while voting")
            }
        }).then(x => {
        console.log(x)
    });
}