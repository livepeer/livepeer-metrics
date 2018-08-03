// app.js
const express = require('express');
const app = express();
const db = require('./DB');
const EventsController = require('./EventsController');
const VideosController = require('./VideosController');
const V2EventsController = require('./v2/EventsController');
const V2VideosController = require('./v2/VideosController');

app.use('/events', EventsController);
app.use('/videos', VideosController);
app.use('/v2/rinkeby/events', V2EventsController(db.connections.rinkeby));
app.use('/v2/mainnet/events', V2EventsController(db.connections.mainnet));
app.use('/v2/rinkeby/videos', V2VideosController(db.connections.rinkeby));
app.use('/v2/mainnet/videos', V2VideosController(db.connections.mainnet));

module.exports = app;
