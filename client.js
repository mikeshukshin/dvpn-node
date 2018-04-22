const contract = require('./services/contract');
const utils = require('./services/utils');
const fs = require('fs');
const { exec } = require('child_process');
const EventEmitter = require('events');

(async () => {
    let serverCount = await contract.getServerCount();
    let serverIndex = Math.floor(Math.random() * serverCount);
    let {serverAddress, ip, port, pricePerHour} = await contract.getServer(serverIndex);

    ip = utils.intToIp(ip);
    let data = await utils.downloadVPNConfig(ip, port);
    let {connectionId, config} = data;

    if(ip === '127.0.0.1') {
        config = config.replace('VPN.SERVERNAME.COM', '127.0.0.1');
        config = config.replace(/(redirect-gateway)/, '#$1');
    }

    let configName = `${serverAddress}-${connectionId}.ovpn`;
    let configPath = `vpn/client/configs/${configName}`;
    utils.saveVPNConfig(config, configPath);

    let onExit = (code) => {
        // console.log(`Exitting with code ${code}`);
    };
    let onSignal = async (signal) => {
        // console.log(`Received ${signal}`);

        fs.unlinkSync(configPath);
        subprocess.kill('SIGTERM');

        let eventEmitter = new EventEmitter();

        if(!contract.isConnected(connectionId)){
            process.exit(0);
            return;
        }

        console.log('Stopping connection...');
        contract.stopConnection(connectionId).then(() => {
            console.log(`Connection ${connectionId} Stopped`);
            eventEmitter.emit('canExitEvent', true);
        }).catch(() => {
            console.log(`Connection ${connectionId} Failed to Stop`);
            eventEmitter.emit('canExitEvent', true);
        });

        eventEmitter.on('canExitEvent', () => {
            process.exit(0);
        });
    };
    process.on('exit', onExit);
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);


    let cmd = `openvpn ${configPath}`;
    console.log(cmd);

    let subprocess = exec(cmd, {} , function (error, stdout, stderr) {
        if (error) {
            console.log(stderr);
        }
    });

    await contract.startConnection(connectionId, serverAddress);

    let interval = setInterval(async () => {
        if(!await contract.isConnected(connectionId)){
            onSignal('SIGINT');
            clearInterval(interval);
        }
    }, 10000);
})();