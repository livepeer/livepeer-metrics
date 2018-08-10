// @flow
import React from 'react'
import moment from 'moment'

const Overview = ({ overview }) => {
  const { videos, segments, fromTime, toTime, distinctBroadcasters } = overview
  return (<div>
    <p>Number of distinct broadcasters: {distinctBroadcasters}</p>
    <p>Videos: total: {videos.total} failed: {videos.failed}</p>
    <p>Total videos duration: {moment.duration(videos.totalDuration).humanize()}</p>
    <p>Segments: emerged: {segments.emerged} uploaded: {segments.uploaded}
      &nbsp; transcoded: {segments.transcoded} failure rate {segments.failureRate.toFixed(2)}%
    </p>
    <p>Average upload time: {segments.avgUploadDuration} ms</p>
    <p>Average transcode time: {segments.avgTranscodeDuration} ms</p>
    <p>starting from {fromTime.toString()} till {(toTime || '').toString()}</p>
  </div>)
}

export default Overview
