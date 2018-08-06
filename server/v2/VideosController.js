'use strict'

const express = require('express');
const events = require('./Events');

function videosAggregator(events) {
  return new Promise(videosAggregatorInt.bind(null, events));
}

function videosAggregatorInt(events, resolve, reject) {
  const videos = {};
  // TODO add flow annotation
  /*
    video object : {
      nonce: String
      hlsStrmID: String
      streamID: String
      success: unknown|true|false
      createTime: Date
      endTime: Date
      streamDuration: Integer // milliseconds
      reason: String // failure reason
      jobID: Integer
      transcoderAddress: String
      broadcasterAddress: String
      creationBlock: Integer
      endBlock: Integer
      startSeq: Integer
      timeTillFirstTranscodedSegment: Integer
      firstTranscodedSegSeq: Integer
      segmentsEmerged: Integer
      emergedSincePrevSum: Integer
      segmentsUploaded: Integer
      segmentUploadTimeSum: Integer
      segmentsUploadFailed: Integer
      segmentsTranscoded: Integer
      segmentsTranscodeTimeSum: Integer
      segmentsTranscodeFailed: Integer
      createBroadcastClientFailed: Integer
      createBroadcastClientFailedReasons: {}
      uploadFailedReasons: {}
      transcodeFailedReasons: {}
    }
  */
  // TODO return fail reasons in separate field, aggregate by days/week..
  const streamCreateFailReasons = {}

  for (let event of events) {
    if (!event.nonce) {
      continue
    }
    const nonce = event.nonce
    const video = videos[nonce] || (videos[nonce] = {
      success: 'unknown',
      startSeq: 0,
      timeTillFirstTranscodedSegment: 0,
      firstTranscodedSegSeq: 0,
      segmentsEmerged: 0,
      emergedSincePrevSum: 0,
      segmentsUploaded: 0,
      segmentUploadTimeSum: 0,
      segmentsUploadFailed: 0,
      segmentsTranscoded: 0,
      segmentsTranscodeTimeSum: 0,
      segmentsTranscodeFailed: 0,
      createBroadcastClientFailed: 0,
      createBroadcastClientFailedReasons: {},
      uploadFailedReasons: {},
      transcodeFailedReasons: {},
    })
    switch (event.event) {
      case 'StreamCreated':
        videos[nonce] = {
          ...video,
          hlsStrmID: event.properties.hlsStrmID,
          createTime: event.createdAt,
          success: 'unknown'
        }
        break
      case 'StreamEnded':
        //set video end time
        video.endTime = event.createdAt
        //set status to succes
        video.success = 'true'
        video.streamDuration = video.endTime - video.createTime
        break
      case 'JobCreated', 'JobReused':
        videos[nonce] = {
          ...video,
          ...event.properties
        }
        break
      case 'SegmentEmerged':
        video.segmentsEmerged++
        video.emergedSincePrevSum += event.properties.sincePrevious
        break
      case 'SegmentUploaded':
        video.segmentsUploaded++
        video.segmentUploadTimeSum += event.properties.uploadDuration
        break
      case 'SegmentUploadFailed':
        // TODO global set with reasons?
        video.segmentsUploadFailed++
        if ((event.properties||{}).reason) {
          const reason = event.properties.reason
          video.uploadFailedReasons[reason] = (video.uploadFailedReasons[reason]||0) + 1
        }
        break
      case 'SegmentTranscoded':
        video.segmentsTranscoded++
        video.segmentsTranscodeTimeSum += event.properties.transcodeDuration
        if (!video.timeTillFirstTranscodedSegment) {
          video.timeTillFirstTranscodedSegment = event.createdAt - video.createTime
          video.firstTranscodedSegSeq = event.properties.seqNo
        }
        // TODO process segmentsInFlight and seqNoDif
        break
      case 'SegmentTranscodeFailed':
        vieo.segmentsTranscodeFailed++
        // TODO save reasons
        if ((event.properties||{}).reason) {
          const reason = event.properties.reason
          video.transcodeFailedReasons[reason] = (video.transcodeFailedReasons[reason]||0) + 1
        }
        // TODO process segmentsInFlight and seqNoDif
        break
      case 'StartBroadcastClientFailed':
        // TODO process this event
        video.createBroadcastClientFailed++
        if ((event.properties||{}).reason) {
          const reason = event.properties.reason
          video.createBroadcastClientFailedReasons[reason] =
            (video.createBroadcastClientFailedReasons[reason]||0) + 1
        }
        break
      case 'StreamCreateFailed':
        video.success = 'false'
        if ((event.properties||{}).reason) {
          const reason = event.properties.reason
          video.reason = reason
          streamCreateFailReasons[reason] = (streamCreateFailReasons[reason]||0) + 1
        }
        break
    }
  }

  //Flatten the hash
  const videosArr = []
  for (let vid in videos) {
    videosArr.push(videos[vid])
  }
  resolve(videosArr);
}

module.exports = function (connection) {
  const router = express.Router();
  const Events = events(connection);

  router.get('/', function (req, res) {
    Events.find({}).sort({
      createdAt: 1
    }).exec(function (err, events) {
      if (err) return res.status(500).send('There was a problem finding the video.')
      videosAggregator(events).then((videosArr) => {
        // TODO - remove: allow all - temporary, for debugging
        res.set('Access-Control-Allow-Origin', '*')
        res.status(200).send(videosArr)
      });
    });
  });
  return router;
};
