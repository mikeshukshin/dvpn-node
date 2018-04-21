const BigNumber = require('bignumber.js');
const fs = require('fs');
const web = require('./web');
const http = require('http');
const request = require('request');

function ipToInt(ip) {
    let parts = ip.split(".");
    let res = new BigNumber(0);
    let two = new BigNumber(2);

    res = res.plus(new BigNumber(parseInt(parts[0], 10)).times(two.exponentiatedBy(24)));
    res = res.plus(new BigNumber(parseInt(parts[1], 10)).times(two.exponentiatedBy(16)));
    res = res.plus(new BigNumber(parseInt(parts[2], 10)).times(two.exponentiatedBy(8)));
    res = res.plus(new BigNumber(parseInt(parts[3], 10)));

    return res;
}

function intToIp(num) {
    num = BigNumber(num);

    let res = num.modulo(256);

    for (let i = 3; i > 0; i--)
    {
        num = num.dividedToIntegerBy(256);
        res = num.modulo(256) + '.' + res;
    }
    return res;
}

function getConfig(){
    let config = fs.readFileSync('config.json');
    return JSON.parse(config);
}

function startWebServer(port){
    web.set('port', port);
    let server = http.createServer(web);

    server.listen(port);
    server.on('error', function (error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        let bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
}

function downloadVPNConfig(ip, port){
    let url = `http://${ip}:${port}/getConfig`;
    console.log(`Downloading config from ${url}`);

    return new Promise((resolve, reject) => {
        request.post({url, json: true}, (err, res, body) => {
            if (err) {
                reject(err);
            }else{
                resolve(body);
            }
        });
    });
}

function saveVPNConfig(config, filePath){
    fs.writeFileSync(filePath, config);
}

module.exports = {
    ipToInt,
    intToIp,
    getConfig,
    startWebServer,
    downloadVPNConfig,
    saveVPNConfig,
};