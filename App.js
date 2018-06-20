// app.js
var express = require('express');
var app = express();
var db = require('./DB');
var EventsController = require('./EventsController');
var VideosController = require('./VideosController');
app.use('/events', EventsController);
app.use('/videos', VideosController);

module.exports = app;