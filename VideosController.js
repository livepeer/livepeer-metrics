
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
                    idx = event.properties["manifestID"] + event.properties["nonce"]
                    videos[idx] = {manifestID: event.properties["manifestID"], createTime: event.createdAt, success: "unknown"}
                    break;
                case "StreamEnded": 
                    idx = event.properties["manifestID"] + event.properties["nonce"]
                    video = videos[idx]
                    if (video != null) {
                        //set video end time
                        video["endTime"] = event.createdAt
                        //set status to succes
                        video["success"] = "true"
                    } else {
                        console.log("Cannot find video: " + idx)
                        //something weird has happened
                    }
                    break
                case "TranscodeSuccess": 
                    //Add to the video's length
                    break
                case "StreamCreateFailed":
                    idx = event.properties["manifestID"] + event.createdAt
                    video["success"] = "false"
                    break
            }
        }

        //Flatten the hash
        videosArr = []
        for (let vid in videos) {
            v = videos[vid]
            videosArr.push(v)
        }

        res.status(200).send(videosArr)
    });
});

module.exports = router;