'use strict'

const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const utils = require('./utils')

module.exports = {
    router
}


function getAverages(query, pipelineGetter) {
  return new Promise((resolve, reject) => {
    const col = mongoose.connection.collection('events')
    const pipeline = Object.keys(query).length > 0 ? [{
        $match: query }, ...pipelineGetter()] : [...pipelineGetter()]
    col.aggregate(pipeline, { allowDiskUse: false, promoteLongs: true }, (err, res) => {
        if (err) {
            reject(err)
            return
        }
        resolve(res)
    })
  })
}

router.get('/', function (req, res) {
  console.log('got /latency request', req.query)
  const query = utils.parseTimeFrame(req.query)
  Promise.all([getAverages(query, getAvgPipeline), getAverages(query, getMedianPipeline)]).then(averages => {
    return Promise.all([averages[0].toArray(), averages[1].toArray()])
  }).then(data => {
    // join data
    const medians = new Map()
    data[1].forEach(element => {
        medians.set(element._id.nonce, element.medianTranscodedAppeared)
    })
    data[0].forEach(el => {
        if (medians.has(el._id.nonce)) {
            el.medianTranscodedAppeared = medians.get(el._id.nonce)
        }
    })
    res.status(200).send(data[0])
  }).catch(err => {
    console.log(err)
    return res.status(500).send('Error')
  })
})

function getAvgPipeline() {
    return [...getCommonPipeline(), {
        $group: {
            _id: { "nonce":"$_id.nonce" },
            avgSourceAppeared: { $avg: "$sourceAppeared" },
            avgTranscodedAppeared: { $avg: "$transcodedAppeared" },
            avgTranscodeDuration: { $avg: "$transcodeDuration" },
            avgTillTranscode: { $avg: "$tillTranscode" },
            avgAfterTranscode: { $avg: "$afterTranscode" },
        }
    }
  ]
}

function getCommonPipeline() {
    return [{
        $addFields: {
            ets: {
                $let: {
                    vars: {
                        a1: [ {"k": "$event", "v": "$ts"} ]
                    },
                    in: {
                        $arrayToObject: "$$a1"

                    }
                }
            }
        }
    }, {
        $group:{
            _id:{ "nonce":"$nonce" ,"properties_seqNo":"$properties.seqNo"  },
                "count": {$sum:1},
                "times": {
                    $mergeObjects: "$ets"
                },
                properties: {
                    $mergeObjects: "$properties"
                },
        }
    }, {
        $addFields: {
            sourceAppeared: {
                $subtract: ["$times.SourceSegmentAppeared", "$times.SegmentEmerged"]
            },
            transcodedAppeared: {
                $subtract: ["$times.TranscodedSegmentAppeared", "$times.SegmentEmerged"]
            },
            transcodeDuration: {
                $subtract: ["$times.SegmentTranscodeEnded", "$times.SegmentTranscodeStarting"]
            },
            tillTranscode: {
                $subtract: ["$times.SegmentTranscodeStarting", "$times.SourceSegmentAppeared"]
            },
            afterTranscode: {
                $subtract: ["$times.TranscodedSegmentAppeared", "$times.SegmentTranscodeEnded"]
            },
        }
    }, {
        $match: {
            $nor: [
                { "sourceAppeared": { $type: "null" } },
                { "tillTranscode": { $type: "null" } },
                { "afterTranscode": { $type: "null" } },
                { "transcodedAppeared": { $type: "null" } }
            ]
        }
    }]
}

function getMedianPipeline() {
    return [...getCommonPipeline(), {
        $group: {
            _id: { "nonce":"$_id.nonce" },
            values: { $push: "$transcodedAppeared" },
            count: { $sum: 1 },
        }
    }, {
        "$unwind": "$values"
    }, {
        "$sort": {
          values: 1
        }
    }, {
        $project: {
            _id: 1,
          "count": 1,
          "values": 1,
          "midpoint": {
            $divide: [ "$count", 2 ]
          }
        }
      }, {
        $project: {
            _id: 1,
          "count": 1,
          "values": 1,
          "midpoint": 1,
          "high": {
            $ceil: "$midpoint"
          },
          "low": {
            $floor: "$midpoint"
          }
        }
      }, {
        $group: {
            _id: { "nonce":"$_id.nonce" },
          values: {
            $push: "$values"
          },
          high: {
            $avg: "$high"
          },
          low: {
            $avg: "$low"
          }
        }
      }, {
        $project: {
          _id: { "nonce":"$_id.nonce" },
          "beginValue": {
            "$arrayElemAt": ["$values" , "$high"]
            } ,
          "endValue": {
             "$arrayElemAt": ["$values" , "$low"]
          }
        }
      }, {
        $project: {
          "medianTranscodedAppeared": {
            "$avg": ["$beginValue" , "$endValue"]
          }
        }
      }
]}
