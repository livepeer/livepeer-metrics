
const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  event: { type: String },
  nonce: { type: String },
  properties: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, index: true }
},
{
  collection: 'events'
}
)

module.exports = mongoose.model('Event', EventSchema)
