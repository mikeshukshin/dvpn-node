const contract = require('./services/contract');
const utils = require('./services/utils');

(async () => {
    let serverCount = await contract.getServerCount();
    let serverIndex = Math.floor(Math.random() * serverCount);
    let {serverAddress, ip, port, pricePerHour} = await contract.getServer(serverIndex);

    let data = await utils.downloadVPNConfig(utils.intToIp(ip), port);
    let {connectionId, config} = data;

    let configName = `${serverAddress}-${connectionId}.ovpn`;
    utils.saveVPNConfig(config, `vpn/client/configs/${configName}`);
})();