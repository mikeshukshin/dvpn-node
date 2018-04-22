let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
const router = express.Router();
const { exec, execSync } = require('child_process');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

router.post('/getConfig', function(req, res, next) {
    let connectionId = Math.round(Math.random()*1e9);
    let configName = `test${connectionId}`;
    let cwd = 'vpn/server/docker';

    execSync(`docker-compose run --rm openvpn easyrsa build-client-full ${configName} nopass`, {cwd, stdio: 'ignore'});
    exec(`docker-compose run --rm openvpn ovpn_getclient ${configName}`, {cwd}, function(error, stdout, stderr){
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
