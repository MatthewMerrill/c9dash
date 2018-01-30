const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

let app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.use('/api', require('./routes/api.js')(io));

server.listen(3000);
