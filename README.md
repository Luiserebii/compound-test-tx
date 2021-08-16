# Compound Test Tx

A simple repo for executing a set of transactions against an asset on specified Compound protocol smart contracts. 

## Setup

### Install

First, install needed packages:
```
npm i
```

### Config

Next, setup configuration data needed for the project. This project expects a `.env` file in the root of the repository with an `INFURA_KEY` and `MNEMONIC` set to an Infura Project ID, and a 12-word mnemonic, respectively. The file should thus look like:
```
INFURA_KEY='xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
MNEMONIC='xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx'
```

