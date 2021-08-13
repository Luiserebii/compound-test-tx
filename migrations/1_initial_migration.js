const Migrations = artifacts.require("Migrations");
const Fauceteer = artifacts.require("Fauceteer");
const IERC20 = artifacts.require("IERC20");
const CErc20Interface = artifacts.require("CErc20Interface");

const addresses = {
  'Fauceteer': '0x67c943Cd1292DB6F41d8B3DC24494b9396cB18A6',
  'BAT': '0x0EC2F54d2eEff7AB0c5ab8E570B894c6B941D9F3',
  'DAI': '0xE503E9484C0787863d9260559D43bf1B68ea4C92',
  'cBAT': '0x49F80ddbFAD529dFe7B35158B733dc50A5f4Ef90',
  'cDAI': '0x8bF0D4747553cFC954914643a7B65797706048fb'
};

module.exports = async (deployer, network, accounts) => {
  if(network == "development") {
    deployer.deploy(Migrations);
  }

  const instances = {};
  instances.Fauceteer = await IERC20.at(addresses.Fauceteer);
  instances.BAT = await IERC20.at(addresses.BAT);
  instances.DAI = await IERC20.at(addresses.DAI);
  instances.cBAT = await CErc20Interface.at(addresses.cBAT);
  instances.cDAI = await CErc20Interface.at(addresses.cDAI);

  console.log(await instances.BAT.balanceOf(accounts[0]));

};
