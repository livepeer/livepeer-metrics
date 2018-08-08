'use strict'

// app.js
const express = require('express');
const app = express();
const db = require('./DB');
const eventsRouter = require('./handlers/EventsController');
const videoRouter = require('./handlers/VideosController');

app.use('/api/events', eventsRouter);
app.use('/api/videos', videoRouter);

module.exports = app;
