// @flow
import React from 'react'
// import { Button } from 'rmwc/Button'
import { TabBar, Tab } from 'rmwc/Tabs';
import moment from 'moment'

import ReactTable from 'react-table'
import axios from 'axios'
// import { Select } from 'rmwc/Select'


const _columns = [
  {
    Header: 'Start',
    //   minWidth: 155,
    accessor: 'createTime'
  },
  { Header: 'End', accessor: 'endTime' },
  { Header: 'Success', accessor: 'success' },
  {
    Header: 'Duration',
    id: 'streamDuration',
    Cell: row => moment.duration(row.value).humanize(),
    accessor: 'streamDuration'
  },
  { Header: 'Job ID', accessor: 'jobID', className: 'text-right' },
  { Header: 'Average Transcode Duration',
    Cell: row => row.value + ' ms',
    accessor: 'avgTranscodeDuration',
    className: 'text-right'
  },
  {
    Header: 'Segments',
    columns: [
      { Header: 'Failures',
        accessor: 'failureRate',
        className: 'text-right',
        Cell: row => row.value.toFixed(2) + '%'
      },
      { Header: 'Emerged', accessor: 'segmentsEmerged', className: 'text-right' },
      { Header: 'Uploaded', accessor: 'segmentsUploaded', className: 'text-right' },
      { Header: 'Transcoded', accessor: 'segmentsTranscoded', className: 'text-right' },
    ]
  },
]

function makeOverview(src) {
  const videos = {
    total: 0,
    failed: 0,
    totalDuration: 0
  }
  const segments = {
    emerged: 0,
    uploaded: 0,
    transcoded: 0,
    avgTranscodeDuration: 0,
    failureRate: 0,
  }
  let fromTime = new Date()
  let toTime = null
  const broadcastersAddresses = new Set()

  let transcodeTime = 0
  for (let vi of src.videos) {
    videos.total++
    if (vi.success !== 'true') {
      videos.failed++
    }
    // console.log('type of createTime', typeof vi.createTime, vi.createTime)
    if (vi.createTime) {
      const createTime = new Date(vi.createTime)
      if (createTime < fromTime) {
        fromTime = createTime
      }
    }
    if (vi.endTime) {
      const endTime = new Date(vi.endTime)
      if (endTime > toTime) {
        toTime = endTime
      }
    }
    if (vi.streamDuration) {
      videos.totalDuration += vi.streamDuration
    }
    if (vi.broadcasterAddress) {
      broadcastersAddresses.add(vi.broadcasterAddress)
    }
    segments.emerged += vi.segmentsEmerged
    segments.uploaded += vi.segmentsUploaded
    segments.transcoded += vi.segmentsTranscoded
    transcodeTime += vi.segmentsTranscodeTimeSum
  }
  if (segments.emerged) {
    segments.failureRate = (segments.emerged - segments.transcoded) / segments.emerged * 100
  }
  segments.avgTranscodeDuration = transcodeTime / segments.transcoded
  return {
    videos,
    segments,
    fromTime,
    toTime,
    distinctBroadcasters: broadcastersAddresses.size,
  }
}

function calcVideosProps(videos) {
  // calc failures rate
  for (let vi of videos) {
    vi.failureRate = vi.segmentsEmerged ?
      (vi.segmentsEmerged - vi.segmentsTranscoded) / vi.segmentsEmerged * 100 : 0
    vi.avgTranscodeDuration = vi.segmentsTranscoded ?
      vi.segmentsTranscodeTimeSum / vi.segmentsTranscoded : 0
  }
}

const Overview = ({ overview }) => {
  const { videos, segments, fromTime, toTime, distinctBroadcasters } = overview
  return (<div>
    <p>Number of distinct broadcasters: {distinctBroadcasters}</p>
    <p>Videos: total: {videos.total} failed: {videos.failed}</p>
    <p>Total videos duration: {moment.duration(videos.totalDuration).humanize()}</p>
    <p>Segments: emerged: {segments.emerged} uploaded: {segments.uploaded}
      &nbsp; transcoded: {segments.transcoded} failure rate {segments.failureRate.toFixed(2)}%
    </p>
    <p>Average transcode time: {segments.avgTranscodeDuration} ms</p>
    <p>starting from {fromTime.toString()} till {(toTime||'').toString()}</p>
  </div>)
}

class VideosView extends React.Component {
  state = {
    activeTabIndex: 0,
    overview: {
      distinctBroadcasters: 0,
      videos: {
        total: 0,
        failed: 0,
        totalDuration: 0,
      },
      segments: {
        emerged: 0,
        uploaded: 0,
        transcoded: 0,
        avgTranscodeDuration: 0,
        failureRate: 0,
      },
      fromTime: new Date(),
      toTime: new Date(),
    },
    data: {
      videos: [],
      failuresReasons: {
        streamCreate: {},
        createBroadcastClient: {},
        upload: {},
        transcode: {}
      }
    }
  }
  componentDidMount() {
    axios('/api/videos').then(resp => {
      console.log('videos: -------:', resp.data)
      const overview = makeOverview(resp.data)
      calcVideosProps(resp.data.videos)
      this.setState((prevState, props) => ({
        data: { ...prevState.data, ...resp.data },
        overview
      }))
    })
  }
  render() {
    const getTab = () => {
      switch (this.state.activeTabIndex) {
        case 0:
          return (<Overview overview={this.state.overview} />)
        case 1:
          return (
            <div >
              <ReactTable data={this.state.data.videos} columns={_columns}
                showPagination={true} sortable={false} />
            </div>
          )
        case 2:
          return (<div>Failures reasonse</div>)
        default:
          return (<div></div>)
      }
    }
    return (<div>
      <TabBar
        activeTabIndex={this.state.activeTabIndex}
        onChange={evt => this.setState({ 'activeTabIndex': evt.detail.activeTabIndex })}
      >
        <Tab>Overview</Tab>
        <Tab>Videos</Tab>
        <Tab>Failures reasons</Tab>
      </TabBar>
      {getTab()}
    </div>)
  }
}

const Videos = props => (
  <div>
    {/* <Select
            label="Network"
            placeholder=""
            options={['Old v1 data', 'Rinkeby', 'Mainnet']}
        /> */}
    <VideosView />
  </div>
)

export default Videos
