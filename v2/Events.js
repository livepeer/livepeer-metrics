
// const db = require('../DB');
const mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({
  event: {type: String},
  nonce: {type: String},
  properties: {type: mongoose.Schema.Types.Mixed},
  createdAt: {type: Date}},
  {
    collection: 'events'
  }
);

module.exports = function(connection) {
  return connection.model('Event', EventSchema);
};
  
// module.exports = {
//   mainnet: db.connections.mainnet.model('Event', EventSchema),
//   rinkeby: db.connections.rinkeby.model('Event', EventSchema)
// };

// mongoose.model('Event', EventSchema);
// module.exports = mongoose.model('Event');
