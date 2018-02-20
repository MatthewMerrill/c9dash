const express = require('express');
const router = express.Router();

const low = require('lowdb');
const lodashId = require('lodash-id');
const FileSync = require('lowdb/adapters/FileSync');

const child_process = require('child_process');
const path = require('path');

let project_procs = {};
let project_numberings = {};
let listeners = new Set();

let projectNumbersUsed = {};

module.exports = function(io, nconf) {

  const db = low(new FileSync(nconf.get('config:db')));
  const auth_db = low(new FileSync(nconf.get('config:auth')));

  db._.mixin(lodashId);
  db.defaults({
      projects: [],
      urlTemplate: 'http://www.mattmerr.com/#CONFIGURE_C9DASH_$PORT',
      baseProjectNumber: 0,
      basePort: 4200,
      postLaunch: ['echo "Server $PORT Launched!"'],
    })
    .write();

  io.on('connection', function(socket) {
    listeners.add(socket);
    socket.on('disconnect', () => listeners.delete(socket));
    for (let id in project_numberings) {
      let url = db.get('urlTemplate')
                  .value()
                  .replace('$PORT', ('00' + project_numberings[id]).slice(-2));
      socket.emit('started', [id, url]);
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

    if (project && (!project_procs[project.id])) {
      let projectNumber = db.get('baseProjectNumber').value();
      while (projectNumbersUsed[projectNumber]) {
        projectNumber += 1;
      }
      let port = projectNumber + db.get('basePort').value();

      project_procs[project.id] = [child_process.fork(
        '/opt/c9sdk/server.js',
        [
          '-w', path.join('/home/merrillm/', project.directory),
          '-p', port,
          '--auth', 
            auth_db.get('username') + ':' + auth_db.get('password').value()
        ])];
      
      
      let postLaunch = db.get('postLaunch').value()
      if (!Array.isArray(postLaunch)) {
        postLaunch = [postLaunch]
      }
      
      for (let idx = 0; idx < postLaunch.length; idx += 1) {
        let postLaunchScript = postLaunch[idx].replace('$PORT', port)
        let child = child_process.exec(postLaunchScript);
        child.stdout.on('data', function(data) {
          console.log('p' + projectNumber + '[' + idx +']: ', data.trimRight()); 
        });
        project_procs[project.id].push();
      }
      
      project_numberings[project.id] = projectNumber;
      projectNumbersUsed[projectNumber] = true;

      let url = db.get('urlTemplate')
                  .value()
                  .replace('$PORT', ('00' + projectNumber).slice(-2));

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
      for (let proc of project_procs[project.id]) {
        proc.kill();
      }
      delete project_procs[project.id];
      delete projectNumbersUsed[project_numberings[project.id]];
      delete project_numberings[project.id];

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


