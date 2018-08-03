
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  event: { type: String },
  nonce: { type: String },
  properties: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date }
},
  {
    collection: 'events'
  }
);

module.exports = function (connection) {
  return connection.model('Event', EventSchema);
};
