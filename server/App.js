'use strict'

// app.js
require('./DB')
const express = require('express')
const cors = require('cors')
const app = express()

// Enable CORS headers for all origins
app.use(cors())

const eventsRouter = require('./handlers/EventsController')
const p2pEventsRouter = require('./handlers/P2PEventsController')
const videoRouter = require('./handlers/VideosController')

app.use('/api/events', eventsRouter)
app.use('/api/p2pevents', p2pEventsRouter)
app.use('/api/videos', videoRouter)

module.exports = app
