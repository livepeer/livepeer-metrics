'use strict'

const mongoose = require('mongoose')
const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()

const P2PEventSchema = new mongoose.Schema({
  event: { type: String },
  nonce: { type: String },
  properties: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, index: true }
},
{
  collection: 'p2pevents'
}
)

const p2pEvent = mongoose.model('P2PEvent', P2PEventSchema)

router.use(bodyParser.json())

// CREATES A Event
router.post('/', function (req, res) {
  console.log(`p2p event got request body:`, req.body)
  const body = req.body
  if (body.event != null) {
    p2pEvent.create({
      event: body.event,
      nonce: body.nonce,
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
  p2pEvent.find({}, function (err, events) {
    if (err) return res.status(500).send('There was a problem finding the event.')
    res.status(200).send(events)
  })
})

module.exports = router
