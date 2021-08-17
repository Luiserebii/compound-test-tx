# Compound Test Tx

A simple repo for executing a set of transactions against an asset on specified Compound protocol smart contracts. 

## Installation

First, install needed packages:
```
npm install
```

## Configuration

Next, setup configuration data needed for the project.

### `.env`
This project expects a `.env` file in the root of the repository with an `INFURA_KEY` and `MNEMONIC` set to an Infura Project ID, and a 12-word mnemonic, respectively. The file should thus look like:
```
INFURA_KEY='xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
MNEMONIC='xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx'
```

### `.eth.config.js`
This file should export an object with a property `addresses` mapping Compound contract names to their deployed addresses on the network. `Fauceteer`, `BAT`, `DAI`, `cBAT`, `cDAI`, and `Unitroller` are the required properties of the `addresses` object. This file might thus look like:
```js
module.exports = {
  addresses: {
    'Fauceteer': '0x96fa14D96145C8a0338Ae840c57A230716d02C63',
    'BAT': '0x832dA1e7FB808c1Fe04e65eC2826C79943Ec5673',
    'DAI': '0x25A4388B3343d73B1878a40DBbF82F7c7ECa4bCC',
    'cBAT': '0x9040D587Ee279948F8A81B43D5351160336FcA45',
    'cDAI': '0x6f131f13c0A68304308Aed13976e3c962E7603A7',
    'Unitroller': '0xfa0719C271B9cB4305612EF71d4eeFf813Ff0E33'
  }
};
```

### `truffe-config.js` **(optional if using Rinkeby)**

If you are using Rinkeby, you do not need to do anything, but if you are looking to use a different testnet, like Ropsten, you will have to configure this file with the proper network data. For more information on how to configure for your desired network, please see: [https://www.trufflesuite.com/docs/truffle/reference/configuration](https://www.trufflesuite.com/docs/truffle/reference/configuration)

## Running Test Tx

Simply run `npm run test-tx` to execute the transactions on the addresses configured above. Note that, if using a network other than Rinkeby, you will need to instead run `npx truffle migrate --network NETWORK`, where `NETWORK` is the name of the network. For example, for Ropsten, one would run:
```
npx truffle migrate --network ropsten
```

## License

This project has been licensed under the MIT License.
