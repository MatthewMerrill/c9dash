const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

let app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const basicAuth = require('express-basic-auth');
const low = require('lowdb');
const nconf = require('nconf');

nconf.argv();
nconf.env();
nconf.defaults({
  http: {
    port: 3000,
  },
  config: {
    auth: 'auth.json',
    db: 'db.json',
  }
});

const FileSync = require('lowdb/adapters/FileSync');
const db = low(new FileSync(nconf.get('config:auth')));

db.defaults({ username: 'default_username', password: 'password123' })
  .write();

app.use(basicAuth({
  users: { [db.get('username').value()]: db.get('password').value() },
  challenge: true,
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use('/api', require('./routes/api.js')(io, nconf));

server.listen(
  nconf.get('http:port'),
  () => console.log(`c9dash listening on port ${nconf.get('http:port')}`));
