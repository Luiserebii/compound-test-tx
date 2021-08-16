const Migrations = artifacts.require("Migrations");
const Fauceteer = artifacts.require("Fauceteer");
const CErc20Interface = artifacts.require("CErc20Interface");
const CErc20Immutable = artifacts.require("CErc20Immutable");
const CErc20Delegator = artifacts.require("CErc20Delegator");
const ComptrollerG1 = artifacts.require("ComptrollerG1");

const BigNumber = require('bignumber.js');

const addresses = {
  'Fauceteer': '0xC33DcaFd15a5B5aaC1923FEAc383e37928E6f60b',
  'BAT': '0x503E390472398d329B6501c85BBF89dF9D432445',
  'DAI': '0x4e8ad90aF369d984bfc689a686a015aD4F47A9c1',
  'cBAT': '0x1e81709B735d9F536B224d47f28bDd3606e6C96d',
  'cDAI': '0x5Df444DDeec02da8d0CEc33EE35f1522c1Cb75E9',
  'Unitroller': '0x6Ad8de99561d2B585ce1597cef3078cA1Fc20899'
};

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
    .multipliedBy(0.3);
  r = await instances.cDAI.redeem(cDAIredeem.toString(10), {from: accounts[1]});
  logtx('B redeems some cDAI for DAI', r);
  cBATredeem = new BigNumber((await instances.cBAT.balanceOf(accounts[0])).toString(10))
    .multipliedBy(0.45);
  r = await instances.cBAT.redeem(cBATredeem.toString(10), {from: accounts[0]});
  logtx('A redeems some cBAT for BAT', r);

  console.log('Finished executing test transactions! :)');
};

function recurseToString(o) {
  for(k of Object.keys(o)) {
    if(typeof o[k] == 'object' && o[k] != null) {
      if(o[k].constructor.name == 'BN') {
        o[k] = o[k].toString(10);
      } else {
        recurseToString(o[k]);
      }
    }
  }
  return o;
}

function logtx(msg, r) {
  console.log(msg);
  console.log(` > ${r.tx}`)
}

function logres(res) {
  console.log(recurseToString(res));
}

/**
 * NOTE: We have to also enter the market of the asset we're borrowing.
 * Proof? Check the error message at
 *  > 0xc6e8f3b0c566958b7cca947a382dd8f31dabf8a4baf377da5098b8cecf76d2bd
 *
 * Note that the error messages align, in ErrorReporter.sol:
 * COMPTROLLER_REJECTION, BORROW_COMPTROLLER_REJECTION, MARKET_NOT_ENTERED
 *
 * Looking at the borrowAllowed() function in ComptrollerG1, we see:
 *
 *    if (!markets[cToken].accountMembership[borrower]) {
 *        return uint(Error.MARKET_NOT_ENTERED);
 *    }
 *
 * Therefore, ensure to add to market for collateral liquidity calculation
 * AND token to borrow.
 */
