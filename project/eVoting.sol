// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract eVoting {

    struct vote {
        address voterAddress;
        bool choice;
    }

    struct voter {
        string voterName;
        bool voted;
    }

    uint private countResult = 0;
    uint public finalResult = 0;
    uint public totalVoter = 0;
    uint public totalVote = 0;

    address public owner;
    string public votingTopic;

    mapping(uint => vote) private votes;
    mapping(address => voter) public voterDirectory;

    enum VotingState {InProgress, Concluded}
    VotingState public state;

    constructor(string memory _proposal){
        owner = msg.sender;
        votingTopic = _proposal;
        state = VotingState.InProgress;
    }

    function addVoter(address _voterAddress, string memory _voterName) public
    inState(VotingState.InProgress)
    onlyOfficial {
        voter memory newVoter;
        newVoter.voterName = _voterName;
        newVoter.voted = false;
        voterDirectory[_voterAddress] = newVoter;
        totalVoter++;
    }


    function submitVote(bool _choice) public inState(VotingState.InProgress) returns (bool voted){
        bool found = false;

        if (bytes(voterDirectory[msg.sender].voterName).length != 0 && !voterDirectory[msg.sender].voted) {
            voterDirectory[msg.sender].voted = true;
            vote memory newVote;
            newVote.voterAddress = msg.sender;
            newVote.choice = _choice;
            if (_choice) {countResult++;}
            votes[totalVote] = newVote;
            totalVote++;
            found = true;
        }
        return true;
    }

    function concludeVote() inState(VotingState.InProgress) onlyOfficial public {
        state = VotingState.Concluded;
        finalResult = countResult;
    }

    modifier condition(bool _condition){
        require(_condition);
        _;
    }
    modifier onlyOfficial(){
        require(msg.sender == owner);
        _;
    }
    modifier inState(VotingState _state){
        require(state == _state);
        _;
    }
}



