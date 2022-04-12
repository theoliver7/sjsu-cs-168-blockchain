"use strict";

const { Miner } = require('spartan-gold');

const Proposal = require('./proposal.js');
const StakeBlockchain = require('./stake-blockchain.js');
const Vote = require('./vote.js');

module.exports = class Validator extends Miner {

    /**
     * We can't update transactions while looking for a proof in this model,
     * unlike in proof-of-work.  Therefore, we accumulate transactions and
     * save them for the next block.
     *
     */
    constructor(...args) {
        super(...args);

        // Storing transactions for next block.
        this.myTransactions = new Set();
    }

    /**
     * Starts listeners and begins block production.
     */
    initialize() {
        this.startNewSearch();

        this.on(StakeBlockchain.POST_TRANSACTION, this.addTransaction);

        // Listeners to collect proposals and votes.
        this.on(StakeBlockchain.BLOCK_PROPOSAL, this.collectProposal);
        this.on(StakeBlockchain.PREVOTE, this.collectPrevote);
        this.on(StakeBlockchain.PRECOMMIT, this.collectPrecommit);
        this.on(StakeBlockchain.COMMIT, this.collectCommit);

        // Collection buckets for proposals and blocks.
        this.proposals = [];
        this.proposedBlocks = {};

        // Tracking votes
        this.prevotes = {};
        this.precommits = {};
        this.commits = {};

        // Start block production
        setTimeout(() => this.newRound(), 0);

    }

    /**
     * In addition to other responsibilities related to searching for a new block,
     * the accumulated power must be copied over for the round.
     */
    startNewSearch() {
        super.startNewSearch();
        this.roundAccumPower = new Map(this.currentBlock.accumPower);

        // After we copy over the accumulated power for this block height,
        // we calculate it for the next height.
        this.currentBlock.updateAccumPower(this.address);

        // Tracking height/round for the proposal.
        this.height = this.currentBlock.chainLength;
        this.round = 0;
    }

    /**
     * Bonded gold is not available for spending.
     */
    get availableGold() {
        return super.availableGold - this.amountGoldBonded();
    }

    /**
     * Verifies that a vote is valid and stores it in the ballotBox
     * if it is.  If there is Byzantine behavior, an exception will
     * be raised.
     *
     * @param {Vote} vote - A vote of whatever kind.
     * @param {Object} ballotBox - The collection of votes.
     */
    verifyAndVote(vote, ballotBox) {
        vote = new Vote(vote);

        if (!vote.isValid(this)) {
            return;
        }

        // Check for Byzantine votes
        out: if (ballotBox[vote.from] !== undefined) {
            let currentVote = ballotBox[vote.from];

            if (vote.fresherThan(currentVote)) {
                // Replace stale vote with new one.
                break out;
            } else if (currentVote.fresherThan(vote)) {
                // Ignore a stale vote.
                return;
            }

            if (currentVote.id === vote.id) {
                // If vote is a duplicate, just ignore it.
                return;
            } else {
                this.postEvidenceTransaction(vote.from, currentVote, vote);
            }
        }

        // If we made it here, store the validator's vote.
        ballotBox[vote.from] = vote;
    }

    /**
     * This method counts the number of votes for a specified block,
     * where the keys identify the blocks and the values represent
     * the total number of votes (amount of stake) for that block.
     *
     * @param {Object} ballotBox - Collection of votes, blockID -> amount votes.
     *
     * @returns ID of the winning block.
     */
    countVotes(ballotBox) {
        let totalStake = this.currentBlock.getTotalStake();
        let votesNeeded = 2 * totalStake / 3;

        let candidateBlocks = {};

        let winningBlockID = undefined;

        Object.keys(ballotBox).forEach((voterAddr) => {
            let stake = this.currentBlock.amountGoldBonded(voterAddr);
            let vote = ballotBox[voterAddr];

            // Ignore stale votes (unless they are commits)
            if (vote.isStale(this.height, this.round)) {
                return;
            }

            let blockID = vote.blockID;
            let currentVotes = candidateBlocks[blockID] || 0;
            currentVotes += stake;
            candidateBlocks[blockID] = currentVotes;
            //this.log(`...${vote.from} votes for ${blockID} (${this.height}-${this.round}) with ${stake} votes`);
            if (currentVotes > votesNeeded) {
                if (blockID === StakeBlockchain.NIL) {
                    winningBlockID = StakeBlockchain.NIL;
                } else {
                    winningBlockID = vote.blockID;
                }
            }
        });

        return winningBlockID;
    }

    /**
     * Start a new round to come to consensus on a block.
     */
    newRound() {
        // If we have committed to a block, we don't do any more rounds
        // until we reach a new height.
        if (this.nextBlock !== undefined) return;

        // Update the round count.
        this.round++;

        // According to TM v. 0.6, commits for older rounds
        // are automatically counted as prevotes and precommits for
        // all subsequent rounds.
        Object.keys(this.commits).forEach((voterAddr) => {
            //this.log(`Copying over vote for ${voterAddr}`);
            let commit = this.commits[voterAddr];
            this.prevotes[voterAddr] = commit;
            this.precommits[voterAddr] = commit;
        });

        this.determineProposer();

        // If the validator is the proposer, propose a block.
        if (this.address === this.currentProposer) {
            // If it previously locked on to a block, share it.
            if (this.lockedBlock !== undefined) {
                this.shareProposal(this.lockedBlock);
            } else {
                this.proposeBlock();
            }
        }

        // We wait to collect proposals before we choose one.
        setTimeout(() => this.prevote(), this.round*StakeBlockchain.DELTA);
    }

    /**
     * Determines the block proposer based on their "accumulated power".
     * It uses a weighted round-robin algorithm where validators with
     * more stake propose blocks more often.
     */
    determineProposer() {
        let proposerPower = 0;
        this.roundAccumPower.forEach((power, addr) => {
            //this.log(`   ${addr} has ${power} (${typeof power}) voting power.`);
            if (power > proposerPower) {
                this.currentProposer = addr;
                proposerPower = power;
            }
        });
        this.log(`The block proposer for ${this.height}-${this.round} is ${this.currentProposer}`);
        this.updatePower(this.roundAccumPower, this.currentBlock.bondBalances, this.currentProposer);
    }

    /**
     * This method implements Tendermint's approach for updating voting power,
     * following the algorithm described in Section 4.3 of the 0.5 version of
     * their paper.  (Note that the 0.6 version of their paper does not show
     * their round-robin algorithm).
     *
     * @param {Map} accumPower - A map of addresses to accumulated power.
     * @param {Map} bondBalances - A map of addresses to the amount of bonded coins.
     * @param proposerAddr - The address of the block proposer.
     */
    updatePower(accumPower, bondBalances, proposerAddr) {
        //
        // **YOUR CODE HERE**
        //
        // For every validator (including the proposer), increase their accumulated
        // power according to the amount of coins they currently have bonded.
        //
        // Calculate the total increase in power.  (You can do this when you loop
        // through the validators in the previous step).
        //
        // Once you have calculated the total increase, deduct that amount from the block
        // proposer's accumulated power.  (The effect of this step is that the proposer
        // is moved back in the queue.)

        let powerIncrease = 0
        accumPower.forEach((power, validatorAddress) => {
            accumPower.set(validatorAddress, power + bondBalances.get(validatorAddress))
            powerIncrease += bondBalances.get(validatorAddress)
        })

        accumPower.set(proposerAddr, accumPower.get(proposerAddr) - powerIncrease)
    }

    /**
     * Makes a proposal for a block, as defined by the proposal class.
     *
     * Note that there should be a "proof-of-lock", but we are omitting
     * it for simplicity.  Note that doing so does open us up to some
     * attacks.
     */
    proposeBlock() {

        this.currentBlock = StakeBlockchain.makeBlock(this.address, this.lastBlock);

        // Add queued-up transactions to block.
        this.myTransactions.forEach((tx) => {
            this.currentBlock.addTransaction(tx, this);
        });
        this.myTransactions.clear();

        this.log(`Proposing block ${this.currentBlock.id} for round ${this.currentBlock.chainLength}-${this.round}.`);

        this.shareProposal(this.currentBlock);
    }

    /**
     * Signs and broadcasts a block proposal.
     *
     * @param {StakeBlock} block - Proposed block.
     */
    shareProposal(block) {
        let proposal = new Proposal({
            from: this.address,
            block: block,
            blockID: block.id,
            height: this.height,
            round: this.round,
            pubKey: this.keyPair.public,
        });

        proposal.sign(this.keyPair.private);

        this.net.broadcast(StakeBlockchain.BLOCK_PROPOSAL, proposal);
    }

    /**
     * This method collects proposals until the wall time.
     * It also stores the proposed block for later use.
     *
     * @param {Proposal} proposal - A proposal for a new block, along with some metadata.
     */
    collectProposal(proposal) {
        this.proposals.push(new Proposal(proposal));
        let block = StakeBlockchain.deserializeBlock(proposal.block);

        // If we don't have the previous block, we don't accept the block.
        // Fetching the missing blocks will be triggered if the block is
        // actually accepted.
        let prevBlock = this.blocks.get(block.prevBlockHash);
        if (prevBlock === undefined) return;

        // Otherwise, we rerun the block to update balances/etc. and store it.
        block.rerun(prevBlock);
        this.proposedBlocks[proposal.blockID] = block;
    }

    /**
     * Prevote for a proposal, by the following rules:
     *
     * 1) If locked on to a previous block, vote for the locked block.
     *
     * 2) Otherwise, if a valid proposal is received, vote for the new block.
     *
     * 3) Otherwise vote NIL.
     *
     * This method should also check for conflicting proposals from the block proposer.
     */
    prevote() {
        let vote = undefined;

        //
        // **YOUR CODE HERE**
        //
// If locked on to a vote, stick with it.
        if (this.lockedBlock !== undefined) {
            vote = Vote.makeVote(this, StakeBlockchain.PREVOTE, this.lockedBlock.id);

        } else {
            // Otherwise, go through all proposals and select the best one.
            let bestProposal = undefined;
            this.proposals.forEach((proposal) => {
                if (proposal.isValid(this)) {
                    // We should not receive 2 valid proposals in a round,
                    // unless they are duplicates or the proposer is Byzantine.
                    if (bestProposal !== undefined) {
                        if (bestProposal.blockID === proposal.blockID) {
                            // Ignore duplicates
                            return;
                        } else {
                            this.postEvidenceTransaction(proposal.from, bestProposal, proposal);
                        }
                    } else {
                        bestProposal = proposal;
                    }
                }
            });

            if (bestProposal === undefined) {
                // No valid proposal received -- vote NIL
                vote = Vote.makeNilVote(this, StakeBlockchain.PREVOTE);
            } else {
                // Otherwise, vote for the best received.
                vote = Vote.makeVote(this, StakeBlockchain.PREVOTE, bestProposal.blockID);
            }
        }
        //this.log(`Voting for block ${vote.blockID}`);

        // Clearing out proposals and sharing vote.
        this.proposals = [];
        this.net.broadcast(StakeBlockchain.PREVOTE, vote);

        // After voting, set timer before determining precommit.
        setTimeout(() => this.precommit(), this.round*StakeBlockchain.DELTA);
    }

    /**
     * Validates prevote, saving it if it is a valid vote.
     * This step will also catch any attempts to double-vote.
     *
     * @param {Vote} vote - incoming vote.
     */
    collectPrevote(vote) {
        this.verifyAndVote(vote, this.prevotes);
    }

    /**
     * Precommit to a block, by the following rules.
     *
     * 1) If a block gains 2/3 votes, lock on that block and broadcast precommit.
     *   Move on to the commit phase.
     *
     * 2) If NIL gains 2/3 votes, release any locks.
     *
     * 3) If no 2/3 majority is reached do nothing.
     */
    precommit() {
        let winningBlockID = this.countVotes(this.prevotes);
        this.prevotes = {};

        // NOTE: If we were following the protocol correctly, we would need to make
        // a proof-of-lock for both block consensus or for NIL consensus.

        //
        // **YOUR CODE HERE**
        //
        if (winningBlockID === undefined) {
            //this.log(`Failed to reach 2/3 majority needed for precommit at height ${this.height}, round ${this.round}.`);
        } else if (winningBlockID === StakeBlockchain.NIL) {
            // If we receive 2/3 NIL votes, release any locks.
            delete this.lockedBlock;
        } else {
            // There is some ambiguity between Tendermint 0.5 and 0.6.  TM 0.5
            // indicates that a validator locks on to a **proposal**.  TM 0.6 instead
            // states that a validator locks on to a **block**.  We follow the latter.
            this.log(`Locking on to block ${winningBlockID}`);
            this.lockedBlock = this.proposedBlocks[winningBlockID];

            // Broadcasting successful precommit.
            let vote = Vote.makeVote(this, StakeBlockchain.PRECOMMIT, winningBlockID);
            this.net.broadcast(StakeBlockchain.PRECOMMIT, vote);
        }
        // Setting to decide on whether to commit.
        setTimeout(() => this.commitDecision(), this.round*StakeBlockchain.DELTA);
    }

    /**
     * Validates precommit vote, saving it if it is a valid vote.
     * This step will also catch any attempts to double-vote.
     *
     * @param {Vote} vote - incoming vote.
     */
    collectPrecommit(precommit) {
        this.verifyAndVote(precommit, this.precommits);
    }

    /**
     * If 2/3 precommits are received, the validator commits.
     * Otherwise, it begins a new round.
     */
    commitDecision() {
        let winningBlockID = this.countVotes(this.precommits);
        this.precommits = {};

        if (winningBlockID === undefined || winningBlockID === StakeBlockchain.NIL) {
            setTimeout(() => this.newRound(), 0);
        } else {
            this.commit(winningBlockID);
        }
    }

    /**
     * As soon as the validator receives 2/3 precommits:
     *
     * 1) Get the block if the validator does not already have it.
     *
     * 2) Once the validator has the block, broadcast a commit.
     */
    commit(winningBlockID) {
        // NOTE: We are not handling the case where the block is not available.
        // In order to do that, we would need to request a missing block if we
        // had not received the initial proposal.

        this.nextBlock = this.proposedBlocks[winningBlockID];

        this.log(`Committing to block ${winningBlockID}`);

        let vote = Vote.makeVote(this, StakeBlockchain.COMMIT, winningBlockID);
        this.net.broadcast(StakeBlockchain.COMMIT, vote);
        //
        // **YOUR CODE HERE**
        //
        // Look up the block for winningBlockID from this.proposedBlocks.
        // (Since we don't drop messages in our simulation, it should be available.)
        //
        // Set this.nextBlock to that block.  Note this should be set to a Block
        // instance, not the ID of a block.
        //
        // Finally, broadcast a commit vote for the block.

        setTimeout(() => this.finalizeCommit(), this.round*StakeBlockchain.DELTA);
    }

    /**
     * Validates commit vote, saving it if it is a valid vote.
     * This step will also catch any attempts to double-vote.
     *
     * @param {Vote} vote - incoming vote.
     */
    collectCommit(commit) {
        this.verifyAndVote(commit, this.commits);
    }

    /**
     * Once we have committed, we wait until we received 2/3 of (weighted) commits
     * from other validators.
     */
    finalizeCommit() {
        let winningBlockID = this.countVotes(this.commits);

        if (winningBlockID === undefined) {
            // If we have less than 2/3 commits, wait longer.
            this.log(`No consensus on ${this.nextBlock.id} (${this.height}-${this.round}) yet.  Waiting...`);
            setTimeout(() => this.finalizeCommit(), StakeBlockchain.DELTA);
        } else {
            this.commits = {};
            setTimeout(() => this.newHeight(), StakeBlockchain.COMMIT_TIME);
        }
    }

    /**
     * Once we have received commits from 2/3 of validators (weighted by their stake),
     * we begin looking for the next block.
     */
    newHeight() {
        // NOTE: The protocol specifies that we should gather up additional signatures
        // at this point.  We are skipping that part.

        // Announce new block.
        this.currentBlock = this.nextBlock;
        this.announceProof();

        // Release our locks.
        delete this.nextBlock;
        delete this.lockedBlock;

        // Start working on the next block.
        this.receiveBlock(this.currentBlock);
        this.startNewSearch();
        this.newRound();
    }

    /**
     * In contrast to the standard version of SpartanGold, we queue up transactions
     * for the next block.  This change is required, because otherwise all signatures
     * would be invalid if we added a new transaction.
     *
     * @param {Transaction} tx - The transaction we wish to add to the block.
     */
    addTransaction(tx) {
        tx = StakeBlockchain.makeTransaction(tx);
        this.myTransactions.add(tx);
    }

    /**
     * In Tendermint, we would post an evidence transaction, seizing a portion
     * of the validator's bonded coins.
     *
     * In our case, we will just crash the system.
     *
     * @param faultyAddr - The address of the Byzantine validator.
     * @param oldMessage - The proposal or vote we had received previously.
     * @param newMessage - The conflicting proposal/vote.
     */
    postEvidenceTransaction(faultyAddr, oldMessage, newMessage) {
        throw new Error(`
      Possible Byzantine behavior by ${faultyAddr}.
      Received conflicting messages:
      -> ${JSON.stringify(oldMessage)}
      -> ${JSON.stringify(newMessage)}`);
    }

    /**
     * Utility method that displays all confirmed balances for all clients,
     * according to the client's own perspective of the network.
     */
    showAllBalances() {
        this.log("Showing balances:");
        for (let [id,balance] of this.lastConfirmedBlock.balances) {
            console.log(`    ${id}: ${balance} (${this.lastConfirmedBlock.amountGoldBonded(id)} staked)`);
        }
    }

};
