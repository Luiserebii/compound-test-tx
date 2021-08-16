const Migrations = artifacts.require("Migrations");
const Fauceteer = artifacts.require("Fauceteer");
const IERC20 = artifacts.require("IERC20");
const CErc20Immutable = artifacts.require("CErc20Immutable");
const CErc20Delegator = artifacts.require("CErc20Delegator");
const ComptrollerG1 = artifacts.require("ComptrollerG1");

const BigNumber = require('bignumber.js');
const { addresses } = require('../.eth.config.js');

module.exports = async (deployer, network, accounts) => {
  if(network == "development") {
    deployer.deploy(Migrations);
  }

  const instances = {};
  instances.Fauceteer = await Fauceteer.at(addresses.Fauceteer);
  instances.BAT = await IERC20.at(addresses.BAT);
  instances.DAI = await IERC20.at(addresses.DAI);
  instances.cBAT = await CErc20Immutable.at(addresses.cBAT);
  instances.cDAI = await CErc20Delegator.at(addresses.cDAI);
  instances.Unitroller = await ComptrollerG1.at(addresses.Unitroller);

  const amnts = {
    mintBAT: '4000000000000000000000',
    mintDAI: '950000000000000000000',
    borrowBAT: '50000000000000000'
  };

  console.log(`A: ${accounts[0]}`);
  console.log(`B: ${accounts[1]}`);

  let r;

  console.log('Requesting tokens from Fauceteer...')
  r = await instances.Fauceteer.drip(addresses.BAT, {from: accounts[0]});
  logtx('A receives BAT', r);
  r = await instances.Fauceteer.drip(addresses.DAI, {from: accounts[1]});
  logtx('B receives DAI', r);
  console.log('BAT and DAI filled!');
  r = await instances.BAT.approve(addresses.cBAT, amnts.mintBAT, {from: accounts[0]});
  logtx('A approves cBAT to transfer BAT', r);
  r = await instances.DAI.approve(addresses.cDAI, amnts.mintDAI, {from: accounts[1]});
  logtx('B approves cDAI to transfer DAI', r);
  console.log('Attempt minting...');
  r = await instances.cBAT.mint(amnts.mintBAT, {from: accounts[0]});
  logtx(`A mints cBAT, supplying the money market with ${amnts.mintBAT}`, r);
  r = await instances.cDAI.mint(amnts.mintDAI, {from: accounts[1]});
  logtx(`B mints cDAI, supplying the money market with ${amnts.mintDAI}`, r);

  console.log('Attempting a cBAT borrow...');
  r = await instances.Unitroller.enterMarkets([addresses.cDAI, addresses.cBAT], {from: accounts[1]});
  logtx('B enters the market for using DAI as collateral, and cBAT to borrow', r);
  r = await instances.cBAT.borrow(amnts.borrowBAT, {from: accounts[1]});
  logtx(`B borrows ${amnts.borrowBAT} BAT`, r);
  
  console.log('Attemping to return borrowed cBAT...');
  r = await instances.BAT.approve(addresses.cBAT, amnts.borrowBAT, {from: accounts[1]});
  logtx('B approves cBAT to transfer borrowed BAT', r);
  r = await instances.cBAT.repayBorrow(amnts.borrowBAT, {from: accounts[1]});
  logtx(`B returns ${amnts.borrowBAT} BAT`, r);

  console.log('Finally, trade in cTokens for our original assets and cleanup...');
  r = await instances.Unitroller.exitMarket(addresses.cDAI, {from: accounts[1]});
  logtx('B exits the cDAI market', r);
  r = await instances.Unitroller.exitMarket(addresses.cBAT, {from: accounts[1]});
  logtx('B exits the cBAT market', r);
  cDAIredeem = new BigNumber((await instances.cDAI.balanceOf(accounts[1])).toString(10))
    .multipliedBy(0.3).integerValue(BigNumber.ROUND_FLOOR);
  r = await instances.cDAI.redeem(cDAIredeem.toString(), {from: accounts[1]});
  logtx('B redeems some cDAI for DAI', r);
  cBATredeem = new BigNumber((await instances.cBAT.balanceOf(accounts[0])).toString(10))
    .multipliedBy(0.45).integerValue(BigNumber.ROUND_FLOOR);
  r = await instances.cBAT.redeem(cBATredeem.toString(), {from: accounts[0]});
  logtx('A redeems some cBAT for BAT', r);

  console.log('Finished executing test transactions! :)');
};

function logtx(msg, r) {
  console.log(msg);
  console.log(` > ${r.tx}`)
}
