const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lock", function () {
  it("Should set the right unlockTime", async function () {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const unlockTime = (await ethers.provider.getBlock("latest")).timestamp + ONE_YEAR_IN_SECS;

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: 1 });

    expect(await lock.unlockTime()).to.equal(unlockTime);
  });
});
