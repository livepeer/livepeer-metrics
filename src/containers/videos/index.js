// @flow
import React from 'react'
import { Route, withRouter } from 'react-router-dom'
import { TabBar, Tab } from 'rmwc/Tabs';
import { LinearProgress } from 'rmwc/LinearProgress'
import { Snackbar } from 'rmwc/Snackbar'
import ReactTable from 'react-table'
import moment from 'moment'
import axios from 'axios'

import Overview from './overview'
import Failures from './failures'

import { makeOverview, calcVideosProps } from './process'

const dateFmt = 'MM Do, HH:mm'
const _columns = [
  {
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
      Cell: row => row.value.toFixed(2) + ' ms',
      accessor: 'avgEmergedSincePrev',
      className: 'text-right'
    }, {
      Header: 'Upload',
      Cell: row => row.value.toFixed(2) + ' ms',
      accessor: 'avgUploadDuration',
      className: 'text-right'
    }, {
      Header: 'Transcode',
      Cell: row => row.value.toFixed(2) + ' ms',
      accessor: 'avgTranscodeDuration',
      className: 'text-right'

    }]
  },
  {
    Header: 'Segments',
    columns: [
      {
        Header: 'Failures',
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

const detailsHeaders = {
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

const tabsPaths = ['/', '/videos', '/failures']
const getTabPath = i => i < tabsPaths.length ? tabsPaths[i] : tabsPaths[0]
const obj2grid = obj => {
  const rows = []
  Object.keys(obj).forEach(key => {
      rows.push(<div className='fails-grid_item'>{key}</div>)
      rows.push(<div className='fails-grid_item'>{obj[key]}</div>)
  })
  return (<div className='fails-grid'>{rows}</div>)
}
const sprint = v => typeof v == 'object' ? obj2grid(v) : String(v)

function obj2list(obj) {
  return Object.keys(detailsHeaders).filter(key => key in obj && (typeof obj[key] != 'object' || Object.keys(obj[key]).length))
    .map(key => {
    return (
      <div class='video-details_item'>{detailsHeaders[key]}:&nbsp;{sprint(obj[key])}</div>
    )
  })
}

const VideoDetails = row => {
  return (
    <div style={{ padding: "20px" }} className='video-details' >
      {obj2list(row.original)}
    </div>
  )
}

class VideosView extends React.Component {
  state = {
    loading: false,
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
    this.setState({ loading: true })
    axios('/api/videos').then(resp => {
      this.setState({ loading: false })
      const overview = makeOverview(resp.data)
      calcVideosProps(resp.data.videos)
      this.setState((prevState, props) => ({
        data: { ...prevState.data, ...resp.data },
        overview
      }))
    }).catch(err => {
      this.setState({ loading: false, showErrorSnack: true, errorMessage: err.toString() })
    })
  }
  getTabIndex() {
    switch (this.props.location.pathname) {
      case '/':
        return 0
      case '/videos':
        return 1
      case '/failures':
        return 2
      default:
        return 0
    }
  }
  render() {
    return (<div>
      {this.state.loading && <LinearProgress determinate={false}></LinearProgress>}
      <TabBar
        activeTabIndex={this.getTabIndex()}
        onChange={evt => this.props.history.push(getTabPath(evt.detail.activeTabIndex))}
      >
        <Tab>Overview</Tab>
        <Tab>Videos</Tab>
        <Tab>Failures reasons</Tab>
      </TabBar>
      <Route exact path="/" render={(props) => (
        <Overview {...props} overview={this.state.overview} />
      )} />
      <Route exact path="/videos" render={(props) => (
        <ReactTable {...props} data={this.state.data.videos} columns={_columns}
          defaultSorted={[{ id: "createTime", desc: true }]}
          className="-striped -highlight"
          showPagination={true} sortable={true}
          SubComponent={VideoDetails}
        />
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
