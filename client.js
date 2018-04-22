const contract = require('./services/contract');
const utils = require('./services/utils');
const { exec } = require('child_process');

(async () => {
    let serverCount = await contract.getServerCount();
    let serverIndex = Math.floor(Math.random() * serverCount);
    let {serverAddress, ip, port, pricePerHour} = await contract.getServer(serverIndex);

    let data = await utils.downloadVPNConfig(utils.intToIp(ip), port);
    let {connectionId, config} = data;

    let configName = `${serverAddress}-${connectionId}.ovpn`;
    let configPath = `vpn/client/configs/${configName}`;
    utils.saveVPNConfig(config, configPath);

    let cmd = `openvpn ${configPath}`;
    console.log(cmd);

    await contract.startConnection(connectionId, serverAddress);
    // exec(cmd, {}, function(error, stdout, stderr){
    //     if(error){
    //         console.error(error);
    //         return;
    //     }
    //
    //     console.log(stdout);
    // });
})();