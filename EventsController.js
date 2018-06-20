// EventController.js

var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.json());
var Events = require('./Events');

// CREATES A Event
router.post('/', function (req, res) {
    if (req.body.event != null) {
        Events.create({
            event: req.body.event,
            properties: req.body.properties,
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
    Events.find({}, function (err, events) {
        if (err) return res.status(500).send("There was a problem finding the event.");
        res.status(200).send(events);
    });
});

module.exports = router;