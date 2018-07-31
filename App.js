// app.js
const express = require('express');
const app = express();
const db = require('./DB');
const EventsController = require('./EventsController');
const VideosController = require('./VideosController');
const V2EventsController = require('./v2/EventsController');

app.use('/events', EventsController);
app.use('/videos', VideosController);
app.use('/v2/rinkeby/events', V2EventsController(db.connections.rinkeby));
app.use('/v2/mainnet/events', V2EventsController(db.connections.mainnet));

module.exports = app;