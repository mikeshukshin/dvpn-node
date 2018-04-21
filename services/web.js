let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
const router = express.Router();
const { exec } = require('child_process');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

router.post('/getConfig', function(req, res, next) {
    let connectionId = Math.round(Math.random()*1e9);
    let configName = `test${connectionId}`;
    let cmd = `docker-compose run --rm openvpn easyrsa build-client-full ${configName} nopass &> /dev/null && docker-compose run --rm openvpn ovpn_getclient ${configName}`;

    exec(cmd, {cwd: 'vpn/server/docker'}, function(error, stdout, stderr){
        if(error){
            res.status(500).send('Error!');
            return;
        }

        res.send(JSON.stringify({
            connectionId,
            config: stdout
        }));
    });
});

app.use('/', router);

module.exports = app;
