'use strict'

const express = require('express');
const router = express.Router();
const Events = require('./Events');

function videosAggregator(events) {
  return new Promise(videosAggregatorInt.bind(null, events));
}

function getDayStart(createTime) {
  return new Date(createTime).setUTCHours(0, 0, 0, 0)
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
      streamCreateFailReasons: {}
      segmentsInFlight: Map<int, int>
      seqNoDif: Map<int, int>
    }
  */
  const streamCreateFailReasons = {}
  const createBroadcastClientFailedReasons = {}
  const uploadFailedReasons = {}
  const transcodeFailedReasons = {}
  const byDay = new Map()
  // by day key - seconds since epoch for the day start
  // by day item :
  /*
    videosTotal: Integer
    videosFailed: Integer
    videosTotalDuration: Integer,
    timeTillFirstTranscodedSegmentSum: Integer
    videosWithTranscodedSegments: Integer
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
    streamCreateFailReasons: {}
  */


  for (let event of events) {
    if (!event.nonce) {
      continue
    }
    if (!event.properties) {
      event.properties = {}
    }
    const nonce = event.nonce
    const video = videos[nonce] || (videos[nonce] = {
      success: 'unknown',
      nonce: 0,
      createTime: null,
      endTime: null,
      streamDuration: 0,
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
      streamCreateFailReasons: {},
      segmentsInFlight: new Map(),
      seqNoDif: new Map(),
    })
    let day = video.createTime ? byDay.get(getDayStart(video.createTime)) || {} : {}
    const createDay = createTime => {
      const ds = getDayStart(createTime)
      if (!byDay.has(ds)) {
        day = {
          videosTotal: 0,
          videosFailed: 0,
          videosTotalDuration: 0,
          timeTillFirstTranscodedSegmentSum: 0,
          videosWithTranscodedSegments: 0,
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
          streamCreateFailReasons: {},
        }
        byDay.set(ds, day)
      } else {
        day = byDay.get(ds)
      }
    }
    switch (event.event) {
      case 'StreamCreated':
        videos[nonce] = {
          ...video,
          hlsStrmID: event.properties.hlsStrmID,
          createTime: event.createdAt,
          success: 'unknown'
        }
        createDay(event.createdAt)
        day.videosTotal++
        break
      case 'StreamEnded':
        //set video end time
        video.endTime = event.createdAt
        //set status to succes
        video.success = 'true'
        video.streamDuration = video.endTime - video.createTime
        day.videosTotalDuration += video.streamDuration
        break
      case 'JobCreated':
      case 'JobReused':
        videos[nonce] = {
          ...video,
          ...event.properties
        }
        break
      case 'SegmentEmerged':
        video.segmentsEmerged++
        video.emergedSincePrevSum += event.properties.sincePrevious
        day.segmentsEmerged++
        day.emergedSincePrevSum += event.properties.sincePrevious
        break
      case 'SegmentUploaded':
        video.segmentsUploaded++
        video.segmentUploadTimeSum += event.properties.uploadDuration
        day.segmentsUploaded++
        day.segmentUploadTimeSum += event.properties.uploadDuration
        break
      case 'SegmentUploadFailed':
        if (!video.createTime) {
          video.createTime = event.createdAt
          createDay(event.createdAt)
        }
        video.segmentsUploadFailed++
        day.segmentsUploadFailed++
        if (event.properties.reason) {
          const reason = event.properties.reason
          video.uploadFailedReasons[reason] = (video.uploadFailedReasons[reason] || 0) + 1
          day.uploadFailedReasons[reason] = (day.uploadFailedReasons[reason] || 0) + 1
          uploadFailedReasons[reason] = (uploadFailedReasons[reason] || 0) + 1
        }
        break
      case 'SegmentTranscoded':
        video.segmentsTranscoded++
        video.segmentsTranscodeTimeSum += event.properties.transcodeDuration
        day.segmentsTranscoded++
        day.segmentsTranscodeTimeSum += event.properties.transcodeDuration
        if (!video.timeTillFirstTranscodedSegment) {
          video.timeTillFirstTranscodedSegment = event.createdAt - video.createTime
          video.firstTranscodedSegSeq = event.properties.seqNo
        }
        if (Object.prototype.hasOwnProperty.call(event.properties, 'segmentsInFlight')) {
          video.segmentsInFlight.set(event.seqNo, event.properties.segmentsInFlight)
        }
        if (Object.prototype.hasOwnProperty.call(event.properties, 'seqNoDif')) {
          video.segmentsInFlight.set(event.seqNo, event.properties.seqNoDif)
        }
        // TODO find a way to infer useful information from segmentsInFlight and seqNoDif
        break
      case 'SegmentTranscodeFailed':
        video.segmentsTranscodeFailed++
        day.segmentsTranscodeFailed++
        if (event.properties.reason) {
          const reason = event.properties.reason
          video.transcodeFailedReasons[reason] = (video.transcodeFailedReasons[reason] || 0) + 1
          day.transcodeFailedReasons[reason] = (day.transcodeFailedReasons[reason] || 0) + 1
          transcodeFailedReasons[reason] = (transcodeFailedReasons[reason] || 0) + 1
        }
        if (Object.prototype.hasOwnProperty.call(event.properties, 'segmentsInFlight')) {
          video.segmentsInFlight.set(event.seqNo, event.properties.segmentsInFlight)
        }
        if (Object.prototype.hasOwnProperty.call(event.properties, 'seqNoDif')) {
          video.segmentsInFlight.set(event.seqNo, event.properties.seqNoDif)
        }
        break
      case 'StartBroadcastClientFailed':
        video.createBroadcastClientFailed++
        if (!video.createTime) {
          video.createTime = event.createdAt
          createDay(event.createdAt)
        }
        day.createBroadcastClientFailed++
        if (event.properties.reason) {
          const reason = event.properties.reason
          video.createBroadcastClientFailedReasons[reason] =
            (video.createBroadcastClientFailedReasons[reason] || 0) + 1
          day.createBroadcastClientFailedReasons[reason] =
            (day.createBroadcastClientFailedReasons[reason] || 0) + 1
          createBroadcastClientFailedReasons[reason] =
            (createBroadcastClientFailedReasons[reason] || 0) + 1
        }
        break
      case 'StreamCreateFailed':
        video.success = 'false'
        day.videosFailed++
        if (event.properties.reason) {
          const reason = event.properties.reason
          video.reason = reason
          streamCreateFailReasons[reason] = (streamCreateFailReasons[reason] || 0) + 1
          video.streamCreateFailReasons[reason] = (video.streamCreateFailReasons[reason] || 0) + 1
          day.streamCreateFailReasons[reason] = (day.streamCreateFailReasons[reason] || 0) + 1
        }
        break
      default:
    }
  }

  // Flatten the hash
  const videosArr = []
  for (let nonce in videos) {
    videos[nonce].nonce = nonce
    videosArr.push(videos[nonce])
  }
  const byDayArr = []
  const days = Array.from(byDay.keys())
  days.sort()
  for (let day of days) {
    const dayObj = byDay.get(day)
    dayObj.day = day
    byDayArr.push(dayObj)
  }
  resolve({
    videos: videosArr,
    byDay: byDayArr,
    failuresReasons: {
      streamCreate: streamCreateFailReasons,
      createBroadcastClient: createBroadcastClientFailedReasons,
      upload: uploadFailedReasons,
      transcode: transcodeFailedReasons
    }
  });
}

const timeFrames = {
  '24h': 24 * 3600 * 1000,
  'week': 7 * 24 * 3600 * 1000,
  'month': 31 * 24 * 3600 * 1000,
  'custom': -1,
  'all': -1
}

router.get('/', function (req, res) {
  const query = {}
  if (req.query.timeFrame && req.query.timeFrame in timeFrames && req.query.timeFrame !== 'all') {
    if (req.query.timeFrame === 'custom') {
      const from = parseInt(req.query.from)
      const to = parseInt(req.query.to)
      if (!isNaN(from) && !isNaN(to) && from < to) {
        query.createdAt = { $gte: new Date(from), $lte: new Date(to) }
      }
    } else {
      const from = Date.now() - timeFrames[req.query.timeFrame]
      query.createdAt = { $gte: new Date(from) }
    }
  }
  Events.find(query).sort({
    createdAt: 1
  }).exec(function (err, events) {
    if (err) {
      console.log(err)
      return res.status(500).send('There was a problem finding the video.')
    }
    videosAggregator(events).then((videosArr) => {
      // TODO - remove: allow all - temporary, for debugging
      res.set('Access-Control-Allow-Origin', '*')
      res.status(200).send(videosArr)
    });
  });
});

module.exports = router;
