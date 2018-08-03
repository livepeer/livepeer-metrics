// EventController.js

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());

const Events = require('./Events');

// CREATES A Event
router.post('/', function (req, res) {
    console.log('v1 got request body:', req.body)
    const body = req.body;
    if (body.event != null) {
        Events.create({
            event: body.event,
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
    Events.find({}, function (err, events) {
        if (err) return res.status(500).send("There was a problem finding the event.");
        res.status(200).send(events);
    });
});

module.exports = router;