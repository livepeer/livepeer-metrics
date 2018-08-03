// server.js
const app = require('./App');
const port = process.env.PORT || 3000;
const server = app.listen(port, function () {
  console.log('Express server listening on port ' + port);
});