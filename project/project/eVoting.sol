// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract eVoting {

    struct vote {
        address voterAddress;
        bool choice;
    }

    struct voter {
        address voterAddress;
        bool voted;
    }

    mapping(address => voter) public voterDirectory;

    uint private countResult = 0;
    uint public finalResult = 0;
    uint public totalVoter = 0;
    uint public totalVote = 0;

    address public owner;
    string public votingTopic;

    mapping(uint => vote) private votes;

    enum VotingState {InProgress, Concluded}
    VotingState public state;

    constructor(string memory _proposal){
        owner = msg.sender;
        votingTopic = _proposal;
        state = VotingState.InProgress;
    }

    function addVoter(address _voterAddress) public inState(VotingState.InProgress) ownerOnly {
        voter memory newVoter;
        newVoter.voterAddress = _voterAddress;
        newVoter.voted = false;
        voterDirectory[_voterAddress] = newVoter;
        totalVoter++;
    }

    function submitVote(bool _choice) public inState(VotingState.InProgress) returns (bool voted){
        require(!voterDirectory[msg.sender].voted, "address already voted");
        require(!voterDirectory[msg.sender], "not eligible to vote");

        voterDirectory[msg.sender].voted = true;
        vote memory newVote;
        newVote.voterAddress = msg.sender;
        newVote.choice = _choice;
        if (_choice) {countResult++;}
        votes[totalVote] = newVote;
        totalVote++;
        return true;
    }

    function concludeVote() inState(VotingState.InProgress) ownerOnly public {
        state = VotingState.Concluded;
        finalResult = countResult;
    }

    modifier ownerOnly(){
        require(msg.sender == owner);
        _;
    }
    modifier inState(VotingState _state){
        require(state == _state);
        _;
    }
}



