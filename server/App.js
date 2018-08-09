'use strict'

// app.js
require('./DB')
const express = require('express')
const app = express()
const eventsRouter = require('./handlers/EventsController')
const videoRouter = require('./handlers/VideosController')

app.use('/api/events', eventsRouter)
app.use('/api/videos', videoRouter)

module.exports = app
