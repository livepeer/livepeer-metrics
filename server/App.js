'use strict'

// app.js
const express = require('express');
const app = express();
const db = require('./DB');
const eventsRouter = require('./v2/EventsController');
const videoRouter = require('./v2/VideosController');

app.use('/api/events', eventsRouter);
app.use('/api/videos', videoRouter);

module.exports = app;
