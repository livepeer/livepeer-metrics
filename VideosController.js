
var express = require('express');
var router = express.Router();
var Events = require('./Events');

router.get('/', function (req, res) {
    Events.find({
        $or: [{event: "StreamCreated"}, {event: "StreamEnded"}]
    }).sort({
        createdAt: 1
    }).exec(function (err, events) {
        if (err) return res.status(500).send("There was a problem finding the video.")

        videos = {};
        for (let event of events) {
            switch (event.event) {
                case "StreamCreated": 
                    idx = event.properties["manifestID"] + event.properties["createTime"]
                    videos[idx] = {manifestID: event.properties["manifestID"], createTime: event.properties["createTime"], success: false}
                    break;
                case "StreamEnded": 
                    idx = event.properties["manifestID"] + event.properties["createTime"]
                    video = videos[idx]
                    if (video != null) {
                        //set video end time
                        video["endTime"] = event.properties["endTime"]
                        //set status to succes
                        video["success"] = true
                    } else {
                        //something weird has happened
                    }
                    break
                case "TranscodeSuccess": 
                    //Add to the video's length
                    break
            }
        }

        res.status(200).send(videos)
    });
});

module.exports = router;