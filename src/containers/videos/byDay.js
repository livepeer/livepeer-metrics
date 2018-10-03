// @flow
import React from 'react'
import ReactTable from 'react-table'
import moment from 'moment'
import DetailsRow from './detailsRow'

const dateFmt = 'MM Do, HH:mm'
const _columns = [{
    Header: 'Day',
    accessor: 'day',
    Cell: row => moment(row.value).format(dateFmt)
  }, {
    Header: 'Videos',
    columns: [{
      Header: 'Total',
      accessor: 'videosTotal',
      className: 'text-right'
    }, {
      Header: 'Failed',
      accessor: 'videosFailed',
      className: 'text-right'
    }, {
      Header: 'Failure %',
      Cell: row => {
        return (row.original.videosTotal ?
          row.original.videosFailed / row.original.videosTotal * 100 : 0) + '%'
      },
      className: 'text-right'
    }, {
      Header: 'Total Duration',
      Cell: row => moment.duration(row.value).humanize(),
      accessor: 'videosTotalDuration',
      className: 'text-right'
    }]
  }, {
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
  }]

const detailsHeaders = {
  createBroadcastClientFailedReasons: 'Create client failed reasons',
  uploadFailedReasons: 'Upload failed reasons',
  transcodeFailedReasons: 'Transcode failed reasons',
  streamCreateFailReasons: 'Stream create fail reasons',
}

const ByDay = (props) => {
  return (<div className='content-area' >
    <ReactTable {...props} columns={_columns}
      defaultSorted={[{ id: "day", desc: true }]}
      className="-striped -highlight content-area"
      showPagination={true} sortable={true}
      SubComponent={DetailsRow.bind(null, detailsHeaders)}
    />
  </div>)
}

export default ByDay
