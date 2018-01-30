'use strict';

angular
  .module('myApp.homeView', ['ngRoute'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
      templateUrl: 'homeView/homeView.html',
      controller: 'HomeCtrl'
    });
  }])
  .factory('mySocket', function(socketFactory) {
    return socketFactory();
  })
  .controller('HomeCtrl', ['$scope', '$http', 'mySocket', function($scope, $http, mySocket) {
    $scope.projects = null;
    $scope.urls = {};
    $scope.currentProject = null;
    $scope.thinking = true;

    $scope.refreshProjects =
      () => {
        $scope.thinking = true;
        $http
          .get('/api/projects')
          .then((res) => {
            $scope.projects = res.data;
            $scope.thinking = false;
          });
      };

    $scope.createProject =
      () => {
        $http
          .post('/api/projects', { "name": "New Project" })
          .then($scope.refreshProjects);
      };

    $scope.switchTo =
      (project) => {
        $scope.currentProject = project;
      };

    $scope.saveProject =
      (project) => {
        if (project) {
          // $scope.thinking = true;
          $http
            .put('/api/project', project)
            // .then($scope.refreshProjects);
        }
        else {
          console.log(project)
        }
      };

    $scope.deleteProject =
      (project) => {
        if (project) {
          $scope.thinking = true;
          $http
            .delete('/api/projects/' + project.id)
            .then($scope.refreshProjects);
          $scope.currentProject = null;
        }
        else {
          console.log(project)
        }
      };

    $scope.launchProject =
      (project) => {
        if (project) {
          $http.post('/api/exec', { id: project.id });
        }
      };

    $scope.stopProject =
      (project) => {
        if (project) {
          $http.post('/api/stop', { id: project.id });
        }
      };

    mySocket.on('started', function(event) {
      $scope.urls[event[0]] = event[1];
      if (event[1] === 'http://www.mattmerr.com') {
        alert('Hey! You need to configure your ');
      }
    });
    mySocket.on('stopped', function(event) {
      $scope.urls[event[0]] = undefined;
    });

    $scope.dragControlListeners = {
      // accept: function(sourceItemHandleScope, destSortableScope) {
      //   return true;
      // },
      // itemMoved: function(event) {
      // },
      orderChanged: function(event) {
        $http.put('/api/projects', $scope.projects);
      },
      // containment: '#board',
      // clone: false,
      // allowDuplicates: false //optional param allows duplicates to be dropped.
    };

    $scope.refreshProjects();
  }]);