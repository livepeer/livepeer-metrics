// db.js

const base = process.env.LivepeerMetricsMongo;
const uris = {
    current: base + 'test?retryWrites=true',
    mainnet: base + 'metrics-mainnet?retryWrites=true',
    rinkeby: base + 'metrics-rinkeby?retryWrites=true'
};

var mongoose = require('mongoose');
const connections = {
    default: mongoose.connect(uris.current),
    mainnet: mongoose.createConnection(uris.mainnet),
    rinkeby: mongoose.createConnection(uris.rinkeby),
};

module.exports = {
    uris,
    connections
};
