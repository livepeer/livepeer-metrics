'use strict'

const timeFrames = {
  '24h': 24 * 3600 * 1000,
  'week': 7 * 24 * 3600 * 1000,
  'month': 31 * 24 * 3600 * 1000,
  'custom': -1,
  'all': -1
}

function parseTimeFrame(query) {
  const mongoQuery = {}
  if (query.timeFrame && query.timeFrame in timeFrames && query.timeFrame !== 'all') {
    if (query.timeFrame === 'custom') {
      const from = parseInt(query.from)
      const to = parseInt(query.to)
      if (!isNaN(from) && !isNaN(to) && from < to) {
        mongoQuery.ts = { $gte: new Date(from), $lte: new Date(to) }
      }
    } else {
      const from = Date.now() - timeFrames[query.timeFrame]
      mongoQuery.ts = { $gte: new Date(from) }
    }
  }
  return mongoQuery
}

module.exports = {
    parseTimeFrame
}
