const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments //https://www.npmjs.com/package/hardhat-deploy
    const { deployer } = await getNamedAccounts() //get the simulating account by harhat
    const chainId = network.config.chainId

    /* VRF */
    // const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30")
    const VRF_SUB_FUND_AMOUNT = "1000000000000000000000"
    let vrfCoordinatorV2Address, subscriptionId
    if (chainId == 31337) {
        //if(developmentChains.includes(network.name))
        // create VRFV2 Subscription
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        // Fund the subscription
        // Usually,  you'd need the link token on a real network
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    /* Lottery */
    const arguments = [
        vrfCoordinatorV2Address,
        networkConfig[chainId]["entranceFee"],
        networkConfig[chainId]["gasLane"],
        subscriptionId,
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["Interval"],
    ]
    const lottery = await deploy("Lottery", {
        from: deployer,
        args: arguments,
        log: true,
        waitComfirmations: network.config.blockConfirmation || 1,
    })

    if (!developmentChains.includes(network.name)) {
        //&& process.env.ETHERSCAN_API_KEY
        log("Verifying...")
        await verify(lottery.address, arguments)
    }
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "lottery"]
