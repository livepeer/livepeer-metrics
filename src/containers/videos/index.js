// @flow
import React from 'react'
import { Route, withRouter } from 'react-router-dom'
import { TabBar, Tab } from 'rmwc/Tabs';
import { LinearProgress } from 'rmwc/LinearProgress'
import { Snackbar } from 'rmwc/Snackbar'
import Select from 'rmwc/Select'
import ReactTable from 'react-table'
import moment from 'moment'
import axios from 'axios'

import Overview from './overview'
import Failures from './failures'
import ByDay from './byDay'
import DetailsRow from './detailsRow'

import { makeOverview } from './process'

const dateFmt = 'MM Do, HH:mm'
const _columns = [{
    Header: 'Date',
    columns: [
      {
        Header: 'Start',
        id: 'createTime',
        accessor: 'createTime',
        Cell: row => moment(row.value).format(dateFmt)
      },
      {
        Header: 'End',
        accessor: 'endTime',
        Cell: row => moment(row.value).format(dateFmt)
      },
    ]
  },
  { Header: 'Success', accessor: 'success' },
  {
    Header: 'Duration',
    id: 'streamDuration',
    Cell: row => moment.duration(row.value).humanize(),
    accessor: 'streamDuration'
  },
  { Header: 'Job ID', accessor: 'jobID', className: 'text-right' },
  {
    Header: 'Average Duration',
    columns: [{
      Header: 'Since prev',
      Cell: row => {
        const val = row.original.segmentsEmerged ?
          row.original.emergedSincePrevSum / row.original.segmentsEmerged : 0
        return val.toFixed(2) + ' ms'
      },
      className: 'text-right'
    }, {
      Header: 'Upload',
      Cell: row => {
        const val = row.original.segmentsUploaded ?
          row.original.segmentUploadTimeSum / row.original.segmentsUploaded : 0
        return val.toFixed(2) + ' ms'
      },
      className: 'text-right'
    }, {
      Header: 'Transcode',
      Cell: row => {
        const val = row.original.segmentsTranscoded ?
          row.original.segmentsTranscodeTimeSum / row.original.segmentsTranscoded : 0
        return val.toFixed(2) + ' ms'
      },
      className: 'text-right'
    }]
  }, {
    Header: 'Segments',
    columns: [
      {
        Header: 'Failures',
        accessor: 'failureRate',
        className: 'text-right',
        Cell: row => {
          const val = row.original.segmentsEmerged ?
            (row.original.segmentsEmerged - row.original.segmentsTranscoded) /
            row.original.segmentsEmerged * 100 : 0
          return val.toFixed(2) + '%'
        },
      },
      { Header: 'Emerged', accessor: 'segmentsEmerged', className: 'text-right' },
      { Header: 'Uploaded', accessor: 'segmentsUploaded', className: 'text-right' },
      { Header: 'Transcoded', accessor: 'segmentsTranscoded', className: 'text-right' },
    ]
  },
]

const timeFrameLabels = [
  { label: 'Last 24h', value: '24h' },
  { label: 'Last Week', value: 'week' },
  { label: 'Last Month', value: 'month' },
  { label: 'All time', value: 'all' },
]
const isValidTimeFrame = timeFrame => !!timeFrameLabels.find(v => v.value === timeFrame)

const detailsHeaders = {
  nonce: 'nonce',
  startSeq: 'Start Seq',
  timeTillFirstTranscodedSegment: 'Time till first transcoded',
  firstTranscodedSegSeq: 'First transcoded seg seq',
  createBroadcastClientFailed: 'Create broadcast client failed',
  createBroadcastClientFailedReasons: 'Create client failed reasons',
  uploadFailedReasons: 'Upload failed reasons',
  transcodeFailedReasons: 'Transcode failed reasons',
  streamCreateFailReasons: 'Stream create fail reasons',
  segmentsInFlight: 'Segments in flight',
  seqNoDif: 'SeqNo difference',
  broadcasterAddress: 'BroadcasterAddress',
  transcoderAddress: 'TranscoderAddress',
  creationBlock: 'CreationBlock',
  creationRound: 'CreationRound',
  endBlock: 'EndBlock',
  hlsStrmID: 'hlsStrmID',
}

const tabsPaths = ['/', '/videos', '/byday', '/failures']
const getTabPath = i => i < tabsPaths.length ? tabsPaths[i] : tabsPaths[0]


class VideosView extends React.Component {
  state = {
    loading: false,
    timeFrame: '',
    showErrorSnack: false,
    errorMessage: '',
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
    this.loadData()
  }
  loadData(_timeFrame) {
    const startTime = Date.now()
    this.videosLoadingStartTime = startTime
    let timeFrame = _timeFrame === undefined ?
      new URLSearchParams(this.props.location.search).get('timeFrame') : _timeFrame
    timeFrame = isValidTimeFrame(timeFrame) ? timeFrame : ''
    this.setState({ loading: true, timeFrame })
    axios.get('/api/videos', { params: { timeFrame} }).then(resp => {
      if (startTime !== this.videosLoadingStartTime) {
        return
      }
      const overview = makeOverview(resp.data)
      this.setState({ loading: false, overview, data: resp.data })
    }).catch(err => {
      if (startTime !== this.videosLoadingStartTime) {
        return
      }
      this.setState({ loading: false, showErrorSnack: true, errorMessage: err.toString() })
    })
  }
  getTabIndex() {
    switch (this.props.location.pathname) {
      case '/':
        return 0
      case '/videos':
        return 1
      case '/byday':
        return 2
      case '/failures':
        return 3
      default:
        return 0
    }
  }
  constructUrl(pathname) {
    return { pathname, search: this.props.location.search }
  }
  getTabPath(i) {
    return this.constructUrl(getTabPath(i))
  }
  render() {
    return (<div>
      <div className='text-right top-bar'>
        <Select
          value={this.state.timeFrame}
          onChange={evt => {
            this.props.history.push({
              pathname: this.props.location.pathname,
              search: '?timeFrame=' + evt.target.value
            })
            this.loadData(evt.target.value)
          }}
          label='Time frame'
          placeholder='-- Select One --'
          options={timeFrameLabels}
        />
      </div>

      {this.state.loading && <LinearProgress determinate={false}></LinearProgress>}
      <TabBar
        activeTabIndex={this.getTabIndex()}
        onChange={evt => this.props.history.push(this.getTabPath(evt.detail.activeTabIndex))}
      >
        <Tab>Overview</Tab>
        <Tab>Videos</Tab>
        <Tab>By day</Tab>
        <Tab>Failures reasons</Tab>
      </TabBar>
      <Route exact path="/" render={(props) => (
        <Overview {...props} overview={this.state.overview} />
      )} />
      <Route exact path="/videos" render={(props) => (
        <ReactTable {...props} data={this.state.data.videos} columns={_columns}
          defaultSorted={[{ id: "createTime", desc: true }]}
          className="-striped -highlight content-area"
          showPagination={true} sortable={true}
          SubComponent={DetailsRow.bind(null, detailsHeaders)}
        />
      )} />
      <Route exact path="/byday" render={(props) => (
        <ByDay data={this.state.data.byDay} />
      )} />
      <Route exact path="/failures" render={(props) => (
        <Failures {...props} failuresReasons={this.state.data.failuresReasons} />
      )} />
      <Snackbar
        show={this.state.showErrorSnack}
        onHide={evt => this.setState({ showErrorSnack: false })}
        message={this.state.errorMessage}
        actionText="Dismiss"
      />
    </div>)
  }
}

export default withRouter(VideosView)
