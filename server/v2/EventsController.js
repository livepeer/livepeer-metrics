// EventController.js

const express = require('express');
const bodyParser = require('body-parser');
const events = require('./Events');


module.exports = function (connection) {
  const router = express.Router();
  router.use(bodyParser.json());

  const Events = events(connection);
  // CREATES A Event
  router.post('/', function (req, res) {
    console.log(`v2 ${connection.db.databaseName} got request body:`, req.body)
    const body = req.body;
    if (body.event != null) {
      Events.create({
        event: body.event,
        nonce: body.nonce,
        properties: body.properties,
        createdAt: new Date()
      }).then(event => {
        res.status(200).send("event created successfully")
      }).catch(err => {
        res.status(400).send("cannot create event")
      })
    } else {
      res.status(500).send("Cannot process request.  Make sure event is specified.");
    }
  });

  router.get('/', function (req, res) {
    console.log(`v2 ${connection.db.databaseName} got get request:`)
    Events.find({}, function (err, events) {
      if (err) return res.status(500).send("There was a problem finding the event.");
      res.status(200).send(events);
    });
  });
  return router;
};
