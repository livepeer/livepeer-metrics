
const express = require('express');
const events = require('./Events');

function videosAggregator(events) {
  return new Promise(videosAggregatorInt.bind(null, events));
}

function videosAggregatorInt(events, resolve, reject) {
  videos = {};
  for (let event of events) {
    switch (event.event) {
      case "StreamCreated":
        idx = event.properties["manifestID"] + event.properties["nonce"]
        videos[idx] = { manifestID: event.properties["manifestID"], createTime: event.createdAt, success: "unknown" }
        break;
      case "StreamEnded":
        if (!event.properties) {
          break;
        }
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
  resolve(videosArr);
}

module.exports = function (connection) {
  const router = express.Router();
  const Events = events(connection);

  router.get('/', function (req, res) {
    Events.find({
      $or: [{ event: "StreamCreated" }, { event: "StreamEnded" }]
    }).sort({
      createdAt: 1
    }).exec(function (err, events) {
      if (err) return res.status(500).send("There was a problem finding the video.")
      videosAggregator(events).then((videosArr) => {
        // TODO - remove: allow all - temporary, for debugging
        res.set('Access-Control-Allow-Origin', '*')
        res.status(200).send(videosArr)
      });
    });
  });
  return router;
};
