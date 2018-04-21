const utils = require('./services/utils');
const contract = require('./services/contract');
const process = require('process');
const EventEmitter = require('events');
let { VPN_SERVER_IP, VPN_SERVER_PRICE, WEB_SERVER_PORT } = utils.getConfig();

function onExit(code){
    console.log(`Exitting with code ${code}`);
}
function onSignal(signal) {
    console.log(`Received ${signal}`);

    let eventEmitter = new EventEmitter();

    console.log('Deannouncing server...');
    contract.deannounceServer().then(() => {
        eventEmitter.emit('deannounceServerEvent', {something: "Bla"})
    });

    eventEmitter.on('deannounceServerEvent', function(myResult){
        console.log('Server deannounced');
        process.exit(0);
    });
}
process.on('exit', onExit);
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);

(async () => {
    if(!await contract.serverAnnounced()) {
        await contract.announceServer(utils.ipToInt(VPN_SERVER_IP), WEB_SERVER_PORT, VPN_SERVER_PRICE);
        console.log('Server announced');
    }else{
        console.log('Server is already announced');
    }

    utils.startWebServer(WEB_SERVER_PORT);
})();