const Migrations = artifacts.require("Migrations");
const Fauceteer = artifacts.require("Fauceteer");
const IERC20 = artifacts.require("IERC20");
const CErc20Interface = artifacts.require("CErc20Interface");
const ComptrollerG1 = artifacts.require("ComptrollerG1");

const addresses = {
  'Fauceteer': '0x67c943Cd1292DB6F41d8B3DC24494b9396cB18A6',
  'BAT': '0x0EC2F54d2eEff7AB0c5ab8E570B894c6B941D9F3',
  'DAI': '0xE503E9484C0787863d9260559D43bf1B68ea4C92',
  'cBAT': '0x49F80ddbFAD529dFe7B35158B733dc50A5f4Ef90',
  'cDAI': '0x8bF0D4747553cFC954914643a7B65797706048fb',
  'Unitroller': '0x641b3E3e96D2a1913340Ad4Df60E1e73D441Ab15'
};

module.exports = async (deployer, network, accounts) => {
  if(network == "development") {
    deployer.deploy(Migrations);
  }

  //Please see: https://medium.com/compound-finance/borrowing-assets-from-compound-quick-start-guide-f5e69af4b8f4

  const instances = {};
  instances.Fauceteer = await Fauceteer.at(addresses.Fauceteer);
  instances.BAT = await IERC20.at(addresses.BAT);
  instances.DAI = await IERC20.at(addresses.DAI);
  instances.cBAT = await CErc20Interface.at(addresses.cBAT);
  instances.cDAI = await CErc20Interface.at(addresses.cDAI);
  instances.Unitroller = await ComptrollerG1.at(addresses.Unitroller);

  const switchboard = {
    s1: false,
    s2: true,
    s3: false, //true,
    s4: false //true
  }

  const amnts = {
    mintBAT: '4000000000000000000000',
    mintDAI: '950000000000000000000',
    borrowBAT: '50000000000000000'//'500000000000000000000'
  };

  let r;

  if(switchboard.s1) {
    //Acquire BAT and DAI from Fauceteer
    console.log('Requesting tokens from Fauceteer...')
    r = await instances.Fauceteer.drip(addresses.BAT, {from: accounts[0]});
    logtx('A receives BAT', r);
    r = await instances.Fauceteer.drip(addresses.DAI, {from: accounts[1]});
    logtx('B receives DAI', r);
    console.log('BAT and DAI filled!');
    //Approve cBAT and cDAI to transfer BAT and DAI respectively
    r = await instances.BAT.approve(addresses.cBAT, amnts.mintBAT, {from: accounts[0]});
    logtx('A approves cBAT to transfer BAT', r);
    r = await instances.DAI.approve(addresses.cDAI, amnts.mintDAI, {from: accounts[1]});
    logtx('B approves cDAI to transfer DAI', r);
    //Mint cTokens!
    console.log('Attempt minting...');
    r = await instances.cBAT.mint(amnts.mintBAT, {from: accounts[0]});
    logtx(`A mints cBAT, supplying the money market with ${amnts.mintBAT}`, r);
    r = await instances.cDAI.mint(amnts.mintDAI, {from: accounts[1]});
    logtx(`B mints cDAI, supplying the money market with ${amnts.mintDAI}`, r);
  } else {
    console.log('Skipping s1...');
  }
  if(switchboard.s2) {
    console.log('Attempting a cBAT borrow...');
    r = await instances.Unitroller.enterMarkets([addresses.cDAI], {from: accounts[1]});
    logtx('B enters the market for using DAI as collateral', r);
    r = await instances.cBAT.borrow(amnts.borrowBAT, {from: accounts[1]});
    logtx(`B borrows ${amnts.borrowBAT} BAT`, r);
    console.log('BAT balance of borrower', (await instances.BAT.balanceOf(accounts[1])).toString(10));
  } else {
    console.log('Skipping s2...');
  }
  if(switchboard.s3) {
    console.log('Attemping to return borrowed cBAT...');
    r = await instances.BAT.approve(addresses.cBAT, amnts.borrowBAT, {from: accounts[1]});
    logtx('B approves cBAT to transfer borrowed BAT', r);
    r = await instances.cBAT.repayBorrow(amnts.borrowBAT, {from: accounts[1]});
    logtx(`B returns ${amnts.borrowBAT} BAT`, r);
  } else {
    console.log('Skipping s3...');
  }
  if(switchboard.s4) {
    console.log('Finally, trade in cTokens for our original assets...');
    r = await instances.cDAI.redeem(await cDAI.balanceOf(accounts[1]), {from: accounts[1]});
    logtx('B redeems all cDAI for DAI', r);
    r = await instances.cBAT.redeem(await cBAT.balanceOf(accounts[0]), {from: accounts[0]});
    log('A redeems all cBAT for BAT', r);
  } else {
    console.log('Skipping s4...');
  }

  let res = await instances.Unitroller.getAccountLiquidity(accounts[1]);
  let res2 = await instances.Unitroller.markets(addresses.cBAT);
  console.log(recurseToString(res));
  console.log(recurseToString(res2))
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
