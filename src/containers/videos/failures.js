// @flow
import React from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemMeta,
  ListGroup,
  ListGroupSubheader,
  ListDivider
} from 'rmwc/List'


function obj2list(obj) {
  const res = Object.keys(obj).map(key => { return { name: key, num: obj[key] } })
  return res.length ? res : [{ name: 'no failures recorded', num: 0 }]
}

const Failures = ({ failuresReasons }) => {
  const { streamCreate, createBroadcastClient, upload, transcode } = failuresReasons
  const groups = [
    { name: 'Stream creation failures', data: obj2list(streamCreate) },
    { name: 'Create broadcast client failures', data: obj2list(createBroadcastClient) },
    { name: 'Segment upload failures', data: obj2list(upload) },
    { name: 'Segment transcode failures', data: obj2list(transcode) },
  ]
  return (<div>
    <List dense>
      {groups.map(group => (
      <ListGroup >
        <ListGroupSubheader ><b>{group.name}</b></ListGroupSubheader>
        {group.data.map(v => (
          <ListItem>
            <ListItemText>{v.name}</ListItemText>
            <ListItemMeta tag="span" basename="">{v.num}</ListItemMeta>
          </ListItem>
        ))}
      </ListGroup>))}
    </List>
  </div>)
}

export default Failures
