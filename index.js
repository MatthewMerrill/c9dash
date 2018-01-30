const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

let app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const basicAuth = require('express-basic-auth');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const db = low(new FileSync('auth.json'));

db.defaults({ 'defaultuser': 'supersecure' }).write();

app.use(basicAuth({
  users: db.value(),
  challenge: true,
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


app.use('/api', require('./routes/api.js')(io));

server.listen(3000);
