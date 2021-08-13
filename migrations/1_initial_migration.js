const Migrations = artifacts.require("Migrations");
const Fauceteer = artifacts.require("Fauceteer");
const IERC20 = artifacts.require("IERC20");
const CErc20Interface = artifacts.require("CErc20Interface");
const ComptrollerInterface = artifacts.require("ComptrollerInterface");

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
  instances.Unitroller = await ComptrollerInterface.at(addresses.Unitroller);

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

  if(switchboard.s1) {
    //Acquire BAT and DAI from Fauceteer
    console.log('Requesting tokens from Fauceteer...')
    await instances.Fauceteer.drip(addresses.BAT, {from: accounts[0]});
    console.log('A receives BAT');
    await instances.Fauceteer.drip(addresses.DAI, {from: accounts[1]});
    console.log('B receives DAI');
    console.log('BAT and DAI filled!');
    //Approve cBAT and cDAI to transfer BAT and DAI respectively
    await instances.BAT.approve(addresses.cBAT, amnts.mintBAT, {from: accounts[0]});
    console.log('A approves cBAT to transfer BAT');
    await instances.DAI.approve(addresses.cDAI, amnts.mintDAI, {from: accounts[1]});
    console.log('B approves cDAI to transfer DAI');
    //Mint cTokens!
    console.log('Attempt minting...');
    await instances.cBAT.mint(amnts.mintBAT, {from: accounts[0]});
    console.log(`A mints cBAT, supplying the money market with ${amnts.mintBAT} BAT`);
    await instances.cDAI.mint(amnts.mintDAI, {from: accounts[1]});
    console.log(`B mints cDAI, supplying the money market with ${amnts.mintDAI} DAI`);
  } else {
    console.log('Skipping s1...');
  }
  if(switchboard.s2) {
    console.log('Attempting a cBAT borrow...');
    await instances.Unitroller.enterMarkets([addresses.cDAI]);
    console.log('B enters the market for using DAI as collateral');
    await instances.cBAT.borrow(amnts.borrowBAT, {from: accounts[1]});
    console.log(`B borrows ${amnts.borrowBAT} BAT`);
    console.log('BAT balance of borrower', (await instances.BAT.balanceOf(accounts[1])).toString(10));
  } else {
    console.log('Skipping s2...');
  }
  if(switchboard.s3) {
    console.log('Attemping to return borrowed cBAT...');
    await instances.BAT.approve(addresses.cBAT, amnts.borrowBAT, {from: accounts[1]});
    console.log('B approves cBAT to transfer borrowed BAT');
    await instances.cBAT.repayBorrow(amnts.borrowBAT, {from: accounts[1]});
    console.log(`B returns ${amnts.borrowBAT} BAT`);
  } else {
    console.log('Skipping s3...');
  }
  if(switchboard.s4) {
    console.log('Finally, trade in cTokens for our original assets...');
    await instances.cDAI.redeem(await cDAI.balanceOf(accounts[1]), {from: accounts[1]});
    console.log('B redeems all cDAI for DAI');
    await instances.cBAT.redeem(await cBAT.balanceOf(accounts[0]), {from: accounts[0]});
    console.log('A redeems all cBAT for BAT');
  } else {
    console.log('Skipping s4...');
  }

  let res = await instances.Uni;
  console.log('Finished executing test transactions! :)');
};
