'use strict'

// app.js
require('./DB')
const express = require('express')
const app = express()
const eventsRouter = require('./handlers/EventsController')
const p2pEventsRouter = require('./handlers/P2PEventsController')
const videoRouter = require('./handlers/VideosController')

app.use('/api/events', eventsRouter)
app.use('/api/p2pevents', p2pEventsRouter)
app.use('/api/videos', videoRouter)

module.exports = app
