// @flow
import React from 'react'

const obj2grid = obj => {
  const rows = []
  Object.keys(obj).forEach((key, i) => {
    rows.push(<div className='fails-grid_item' key={key} >{key}</div>)
    rows.push(<div className='fails-grid_item' key={key + '-' + i} >{obj[key]}</div>)
  })
  return (<div className='fails-grid'>{rows}</div>)
}
const sprint = v => typeof v === 'object' ? obj2grid(v) : String(v)

function obj2list(headers, obj) {
  return Object.keys(headers).filter(key => key in obj && (typeof obj[key] !== 'object' || Object.keys(obj[key]).length))
    .map(key => {
      return (
        <div className='video-details_item' key={key}>{headers[key]}:&nbsp;{sprint(obj[key])}</div>
      )
    })
}

const DetailsRow = (headers, row) => {
  return (
    <div style={{ padding: "20px" }} className='video-details' >
      {obj2list(headers, row.original)}
    </div>
  )
}

export default DetailsRow
