// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error Lottery_NotEnoughETHEntered();
error Lottery_TransferFailed();
error Lottery_NotOPEN();
error Lottery_UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 lotteryState);

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

/**@title A sample Raffle Contract
 * @author Patrick Collins, Bonnie
 * @notice This contract is for creating a sample raffle contract
 * @dev This implements the Chainlink VRF Version 2
 */
contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type Declarations */
    enum LotteryState {
        OPEN,
        CALCULATING
    } //uint256 0 = open, 1 = calculating

    /* State Varibles */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players; //when player win, we have to pay them
    VRFCoordinatorV2Interface private immutable i_COORDINATOR;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUMWORDS = 1;

    // Lottery Variables
    address private s_recentWinner;
    LotteryState private s_lotteryState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /* Events */
    event LotteryEnter(address indexed player);
    event RequestLotteryWinner(uint256 indexed requestID);
    event WinnerPicked(address indexed winner);

    /* Functions */
    constructor(
        address vrfCoordinatorV2, //contract
        uint256 _entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = _entranceFee;
        i_COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = LotteryState.OPEN; //or s_lotteryState = LotteryState(0);
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert Lottery_NotEnoughETHEntered();
        }
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery_NotOPEN();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True.
     * the following should be true for this to return true:
     * 1. The time interval has passed between raffle runs.
     * 2. The lottery is open.
     * 3. The contract has ETH.
     * 4. Implicity, your subscription is funded with LINK.
     */
    function checkUpkeep(
        bytes memory /*checkData*/ //what is calldate
    )
        public
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (s_lotteryState == LotteryState.OPEN);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * and it kicks off a Chainlink VRF call to get a random winner.
     */
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Lottery_UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_lotteryState)
            );
        }
        s_lotteryState = LotteryState.CALCULATING;
        uint256 requestID = i_COORDINATOR.requestRandomWords(
            i_gasLane, //The maximum gas price, ur willing to pay for a request in wei.
            i_subscriptionId,
            REQUEST_CONFIRMATIONS, //How many confirmations the Chainlink node should wait before responding.
            i_callbackGasLimit, //The limit for how much gas to use for the callback request to your contract's fulfillRandomWords() function, depends on hoe fulfillRandomWords function work.
            NUMWORDS //How many random number we want.
        );
        emit RequestLotteryWinner(requestID);
    }

    /**
     * @dev This is the function that Chainlink VRF node
     * calls to send the money to the random winner.
     */
    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        //Pick winner
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner]; //why payable???
        s_recentWinner = recentWinner;

        //Reset game
        s_lotteryState = LotteryState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;

        //Pay to winner
        (bool success, ) = recentWinner.call{value: address(this).balance}(""); //Ref:https://ethereum.stackexchange.com/questions/96685/how-to-use-address-call-in-solidity
        //require(success)
        if (!success) {
            revert Lottery_TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /* View/ Pure functions */
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 _index) public view returns (address) {
        return s_players[_index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function getNumWord() public pure returns (uint32) {
        return NUMWORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestComfirmation() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
