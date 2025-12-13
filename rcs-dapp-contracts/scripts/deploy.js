const { ethers } = require("hardhat");

async function main() {
  const ONE_HOUR_IN_SECS = 60 * 60;
  const unlockTime = (await ethers.provider.getBlock("latest")).timestamp + ONE_HOUR_IN_SECS;

  const lock = await ethers.deployContract("Lock", [unlockTime]);

  await lock.waitForDeployment();

  console.log(
    `Lock with unlock timestamp ${unlockTime} deployed to ${lock.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});