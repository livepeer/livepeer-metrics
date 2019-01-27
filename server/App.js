'use strict'

// app.js
require('./DB')
const path = require('path')
const express = require('express')
const cors = require('cors')
const app = express()

// Enable CORS headers for all origins
app.use(cors())

if (process.env.SERVESTATIC) {
    app.use(express.static('build'))
}

const eventsRouter = require('./handlers/EventsController')
const p2pEventsRouter = require('./handlers/P2PEventsController')
const videoRouter = require('./handlers/VideosController')
const latencyRouter = require('./handlers/latency').router

app.use('/api/events', eventsRouter)
app.use('/api/p2pevents', p2pEventsRouter)
app.use('/api/videos', videoRouter)
app.use('/api/latency', latencyRouter)

/* final catch-all route to index.html defined last */
if (process.env.SERVESTATIC) {
    const indexFile = path.resolve(__dirname, '../build/index.html')
    app.get('/*', (req, res) => {
        res.sendFile(indexFile)
    })
}

module.exports = app
