// Run on the real testnet
// 1. Get our SubId for Chainlink VRF
// 2. Deploy ourcontract using the SubId
// 3. Register the contract with Chainlink VRF & it's subId - add the contractAddr as the consumer //https://vrf.chain.link/rinkeby/9438
// 4. Register the contract with Chainlink Keepers  //https://keepers.chain.link/
// 5. Run staging tests

const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config.js")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Staging Test", function () {
          let lottery, lotteryEntranceFee, deployer
          const chainId = network.config.chainId

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              //   await deployments.fixture(["all"]) //because we'll run deploy, then contracts should have be deployed
              lottery = await ethers.getContract("Lottery", deployer)
              lotteryEntranceFee = await lottery.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the lottery
                  console.log("Setting up test...")
                  const startingTimeStamp = await lottery.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter the lottery
                      // Just in case the blockchain moves REALLY fast  //not quite understand
                      lottery.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const recentWinner = await lottery.getRecentWinner()
                              const lotteryState = await lottery.getLotteryState()
                              const winnerEndingBalance = await accounts[0].getBalance() //because there's only deployer be the player
                              const endingTimeStamp = await lottery.getLatestTimeStamp()
                              await expect(lottery.getPlayer(0)).to.be.reverted // check if players reallly be reset
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(lotteryState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(lotteryEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      // Then entering the lottery
                      console.log("Entering Lottery...")
                      const tx = await lottery.enterLottery({ value: lotteryEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()

                      // and this code WONT complete until our listener has finished listening!
                  })
              })
          })
      })
