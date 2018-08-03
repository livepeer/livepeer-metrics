const mongoose = require('mongoose');
const EventSchema = new mongoose.Schema({
  event: { type: String },
  properties: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date }
},
  {
    collection: 'events'
  }
);

mongoose.model('Event', EventSchema);
module.exports = mongoose.model('Event');
