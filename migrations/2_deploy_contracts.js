// migrations/2_deploy_contracts.js
const LandRecord = artifacts.require("LandRecord");

module.exports = function (deployer) {
  deployer.deploy(LandRecord);
};