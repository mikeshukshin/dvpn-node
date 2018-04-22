const net = require('net');
const moment = require('moment');
const contract = require('../services/contract');
const path = require('path');
const { exec } = require('child_process');

// let client;

function onExit(code){
    console.log(`Exitting with code ${code}`);
    // client.end();
}
process.on('exit', onExit);

async function checkConnections(connectionIds){
    let connectionsToKill = [];
    for(let connectionName of connectionIds) {
        let connectionId = connectionName.match(/(\d*)$/)[1];
        let isConnected = await contract.isConnected(connectionId);
        let killConnection = false;

        if(isConnected){
            let { startedAt, affordableTime } = await contract.getConnectionInfo(connectionId);
            let connectionTime = moment.utc().unix() - startedAt;

            if(connectionTime >= affordableTime + 20){
                killConnection = true;
            }

            // console.log(`${connectionId}: ${connectionTime}s`);
        }else{
            // console.log(`${connectionId}: not connected`);
            killConnection = true
        }

        if(killConnection){
            connectionsToKill.push(connectionName);
        }
    }
    return connectionsToKill;
}

setInterval(() => {
    let client = net.createConnection({ port: 7505 }, () => {
        client.write('status 2\r\n');
    });
    client.on('data', async (data) => {
        let headers = data.toString().split('\r\n').filter(x => x.match(/^HEADER,CLIENT_LIST/));
        if(!headers.length) return;
        let header = headers[0].split(',').slice(1);
        let nameIndex = header.indexOf('Common Name');
        let connectionNames = data.toString()
            .split('\r\n')
            .filter(x => x.match(/^CLIENT_LIST/))
            .map(x => x.split(',')[nameIndex]);

        let connectionsToKill = await checkConnections(connectionNames);

        for(let connectionName of connectionsToKill){
            let cmd = `docker-compose run --rm openvpn ovpn_revokeclient ${connectionName}`;

            let p1 = new Promise((resolve, reject) => {
                let cwd = path.join(__dirname, '../vpn/server/docker');
                let subprocess = exec(cmd, {cwd}, function (error, stdout, stderr) {
                    if (error) {
                        // console.log(stderr);
                        reject(stderr);
                    }else{
                        // console.log(stdout);
                        resolve(stdout);
                    }
                });

                subprocess.stdout.on('data', (chunk) => {
                    if(chunk.indexOf('Continue with revocation:') !== -1){
                        let write = () => {
                            if(!subprocess.stdin.write('yes\n')){
                                subprocess.stdin.once('drain', write);
                            }
                        };
                        write();
                    }
                });
            });

            let p2 = new Promise((resolve, reject) => {
                client.write(`kill ${connectionName}\r\n`, () => {
                    if(process.send) {
                        process.send(`Connection ${connectionName} killed`);
                    }else{
                        console.log(`Connection ${connectionName} killed`);
                    }
                    resolve()
                });
            });

            let p3 = new Promise(async (resolve, reject) => {
                let connectionId = connectionName.match(/(\d*)$/)[1];

                if(!await contract.isConnected(connectionId)){
                    resolve();
                    return;
                }

                try {
                    await contract.stopConnection(connectionId);
                    console.log(`Connection ${connectionId} stopped`);
                    resolve();
                }catch(e){
                    console.log(`Connection ${connectionId} failed to stop: ${e}`);
                    reject();
                }
            });

            try {
                await Promise.all([p1, p2, p3])
            }catch(e){
                console.error(x);
            }
        }

        client.end();
    });
}, 10000);