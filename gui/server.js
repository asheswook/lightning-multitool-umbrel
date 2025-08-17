const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ini = require('ini');

const app = express();
const port = 3000;
const confPath = path.join(process.env.LMT_CONF_PATH || '/app', 'lmt.conf');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to read and parse the config file
function getConfig() {
    try {
        if (fs.existsSync(confPath)) {
            const configString = fs.readFileSync(confPath, 'utf-8');
            return ini.parse(configString);
        } else {
            // Return a default structure if the file doesn't exist
            return {
                General: {}, Oksusu: {}, Server: {}, LND: {}, LNURL: {}, Nostr: {}
            };
        }
    } catch (error) {
        console.error('Error reading config file:', error);
        return {
            General: {}, Oksusu: {}, Server: {}, LND: {}, LNURL: {}, Nostr: {}
        };
    }
}

app.get('/', (req, res) => {
    const config = getConfig();
    res.render('index', { config });
});

app.post('/save', (req, res) => {
    const config = getConfig();

    // Update config with form data
    // General
    config.General['general.username'] = req.body['general.username'];

    // Oksusu
    config.Oksusu['oksusu.enabled'] = req.body['oksusu.enabled'] === 'on';
    config.Oksusu['oksusu.token'] = req.body['oksusu.token'];
    config.Oksusu['oksusu.server'] = req.body['oksusu.server'];

    // Server
    config.Server['server.host'] = req.body['server.host'];
    config.Server['server.port'] = req.body['server.port'];

    // LND
    config.LND['lnd.host'] = req.body['lnd.host'];
    config.LND['lnd.macaroonpath'] = req.body['lnd.macaroonpath'];

    // LNURL
    config.LNURL['lnurl.domain'] = req.body['lnurl.domain'];
    config.LNURL['lnurl.min-sendable'] = req.body['lnurl.min-sendable'];
    config.LNURL['lnurl.max-sendable'] = req.body['lnurl.max-sendable'];
    config.LNURL['lnurl.comment-allowed'] = req.body['lnurl.comment-allowed'];

    // Nostr
    config.Nostr['nostr.privatekey'] = req.body['nostr.privatekey'];
    config.Nostr['nostr.publickey'] = req.body['nostr.publickey'];
    config.Nostr['nostr.relays'] = req.body['nostr.relays'];

    try {
        // Ensure the directory exists
        const dir = path.dirname(confPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(confPath, ini.stringify(config, { section: '' }));
        res.redirect('/?saved=true');
    } catch (error) {
        console.error('Error writing config file:', error);
        res.status(500).send('Failed to save configuration.');
    }
});

app.listen(port, () => {
    console.log(`GUI server listening on port ${port}`);
});
