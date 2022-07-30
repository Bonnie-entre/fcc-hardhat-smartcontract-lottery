// what is mock deploy for? why??
// we cannot directly use chainlink contract but to deploy first? so that we can import? or use its contract address in our Lottery.sol???

const { network, ethers } = require("hardhat")
// const { deploymentChains } = require("../helper-harhat-config.js")   //for 2nd if expression

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is this the premium in LINK? (how much do each request need)  //https://docs.chain.link/docs/vrf-contracts/
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

// Chainlink Nodes pay the gas fees to give us randomness & do external execution
// So they price of request change based on the price of gas

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts() //get the simulating account by harhat
    const chainID = network.config.chainId

    // If we are on a local development network, we need to deploy mocks!
    if (chainID == 31337) {
        //if(deploymentChains.includes(network.name))
        log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        })

        log("Mocks Deployed!")
        log("----------------------------------------------------------")
        log("You are deploying to a local network, you'll need a local network running to interact")
        log(
            "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!"
        )
        log("----------------------------------------------------------")
    }
}

module.exports.tags = ["mocks", "all"] //command line 的關鍵字
