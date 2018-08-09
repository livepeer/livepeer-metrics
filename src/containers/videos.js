import React from 'react'
// import { Button } from 'rmwc/Button'
import ReactTable from 'react-table'
import axios from 'axios'
import { Select } from 'rmwc/Select'


const _columns = [
    {
        Header: 'Start',
        //   minWidth: 155,
        accessor: 'createTime'
    },
    {
        Header: 'End',
        //   minWidth: 155,
        accessor: 'endTime'
    },
    {
        Header: 'Success',
        //   minWidth: 155,
        accessor: 'success'
    },
    {
        Header: 'Manifest',
        minWidth: 155,
        accessor: 'manifestID'
    },
]

class VideosTable extends React.Component {
    state = {
        data: []
    }
    componentDidMount() {
        axios('http://metrics.livepeer.org/videos').then(data => {
            console.log('videos: -------:', data)
            this.setState({ data: data.data })
        })
    }
    render() {
        return (
            <ReactTable data={this.state.data} columns={_columns} showPagination={true} sortable={false} />
        )
    }
}

const Videos = props => (
    <div>
        <h4>Videos</h4>
        <Select
            label="Network"
            placeholder=""
            options={['Old v1 data', 'Rinkeby', 'Mainnet']}
        />
        <VideosTable />
    </div>
)

export default Videos
