const Web3 = require('web3');
const { promisify } = require('util');
const utils = require('./utils');

let { CONTRACT_ABI, CONTRACT_ADDRESS, CONTRACT_MANAGER_KEY, ETH_NODE_URL } = utils.getConfig();
let web3 = new Web3(new Web3.providers.HttpProvider(ETH_NODE_URL));

let contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
let manager = web3.eth.accounts.privateKeyToAccount(CONTRACT_MANAGER_KEY);

let tx = {
    from: manager.address,
    gas: 2000000,
};

function announceServer(ip, port, pricePerHour){
    return contract.methods.announceServer(ip, port, pricePerHour).send(tx);
}

function deannounceServer(){
    return contract.methods.deannounceServer().send(tx);
}

function serverAnnounced(){
    return contract.methods.serverAnnounced(manager.address).call();
}

function getServerCount(){
    return contract.methods.getServerCount().call();
}

function getServer(index){
    return contract.methods.getServer(index).call();
}


module.exports = {
    announceServer,
    deannounceServer,
    serverAnnounced,
    getServerCount,
    getServer,
};