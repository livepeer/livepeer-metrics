'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const Events = require('./Events')
const router = express.Router()
const NodeCache = require( "node-cache" )
const nonceMap = new NodeCache({ stdTTL: 600, useClones: false })

router.use(bodyParser.json())

// CREATES A Event
router.post('/', function (req, res) {
  console.log(`v2  got request body:`, req.body)
  const body = req.body
  if (body.event != null) {
    const mid = body.properties && body.properties.manifestID
    if (body.nonce !== '0' && mid) {
      nonceMap.set(body.properties.manifestID, body.nonce)
    } else if (body.nonce === '0' && mid) {
      body.nonce = nonceMap.get(mid) || '0'
    }
    Events.create({
      event: body.event,
      nonce: body.nonce,
      nodeId: body.nodeId,
      nodeType: body.nodeType,
      ts: new Date(+body.ts),
      properties: body.properties,
      createdAt: new Date()
    }).then(event => {
      res.status(200).send('event created successfully')
    }).catch(err => {
      console.log(err)
      res.status(400).send('cannot create event')
    })
  } else {
    res.status(500).send('Cannot process request.  Make sure event is specified.')
  }
})

router.get('/', function (req, res) {
  Events.find({}, function (err, events) {
    if (err) return res.status(500).send('There was a problem finding the event.')
    res.status(200).send(events)
  })
})

module.exports = router
