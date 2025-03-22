const hre = require("hardhat");

async function deployContract() {
    const SimpleStorageFactory = await hre.ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorageFactory.deploy();
    await simpleStorage.deployed();

    console.log(`SimpleStorage deployed at: ${simpleStorage.address}`);
}

deployContract()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Deployment failed:", err);
        process.exit(1);
    });
