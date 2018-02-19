const express = require('express');
const router = express.Router();

const low = require('lowdb');
const lodashId = require('lodash-id');
const FileSync = require('lowdb/adapters/FileSync');

const child_process = require('child_process');
const path = require('path');

let project_procs = {};
let project_ports = {};
let listeners = new Set();

let portsUsed = {};

module.exports = function(io, nconf) {

  const db = low(new FileSync(nconf.get('config:db')));
  const auth_db = low(new FileSync(nconf.get('config:auth')));

  db._.mixin(lodashId);
  db.defaults({ projects: [], urlTemplate: 'http://www.mattmerr.com' })
    .write();

  io.on('connection', function(socket) {
    listeners.add(socket);
    socket.on('disconnect', () => listeners.delete(socket));
    for (let id in project_ports) {
      socket.emit('started', [id, db.get('urlTemplate').value().replace('$PORT', project_ports[id])]);
    }
  });

  router.get('/projects', (req, res) => {
    res.json(db.get('projects').value());
  });

  router.post('/projects', (req, res) => {
    db.get('projects')
      .insert(req.body)
      .write();
    res.json(req.body);
  });

  router.post('/exec', (req, res) => {
    let project = db.get('projects')
      .getById(req.body.id)
      .value();

    if (project && (!project_procs[project.id] || project_procs[project.id].killed)) {
      let port = 8100;
      while (portsUsed[port]) {
        port += 1;
      }

      project_procs[project.id] = child_process.fork(
        '/opt/c9sdk/server.js',
        [
          '-w', path.join('/home/merrillm/', project.directory),
          '-p', port,
          '--auth', 
            auth_db.get('username') + ':' + auth_db.get('password').value()
        ]);
      project_ports[project.id] = port;
      portsUsed[port] = true;

      let url = db.get('urlTemplate').value().replace('$PORT', port);

      listeners.forEach(socket =>
        socket.emit('started', [project.id, url]));
      res.sendStatus(200);
    }
    else {
      res.sendStatus(400);
    }
  });

  router.post('/stop', (req, res) => {
    let project = db.get('projects')
      .getById(req.body.id)
      .value();

    if (project && project_procs[project.id] && !project_procs[project.id].killed) {
      project_procs[project.id].kill();
      project_procs[project.id] = undefined;
      portsUsed[project_ports[project.id]] = undefined;
      project_ports[project.id] = undefined;

      listeners.forEach(socket => socket.emit('stopped', [project.id]));
      res.sendStatus(200);
    }
    else {
      res.sendStatus(400);
    }
  });

  router.put('/project', (req, res) => {
    db.get('projects')
      .replaceById(req.body.id, req.body)
      .write();
    res.json(req.body);
  });

  router.put('/projects', (req, res) => {
    db.set('projects', req.body)
      .write();
    res.json(req.body);
  });

  router.delete('/projects/:id', (req, res) => {
    db.get('projects')
      .removeById(req.params['id'])
      .write();
    res.json(req.body);
  });

  return router;
};
