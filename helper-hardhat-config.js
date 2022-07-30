const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab", //https://docs.chain.link/docs/vrf-contracts/
        entranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
        subscriptionId: "9438",
        callbackGasLimit: "500000", // 500,000 gas
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        Interval: "30",
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei   //local any amount is ok
        callbackGasLimit: "500000", // 500,000 gas
        Interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
