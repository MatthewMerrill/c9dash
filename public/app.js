'use strict';

// Declare app level module which depends on views, and components
angular
  .module('myApp', [
    'ngRoute',
    'btford.socket-io',
    'ngMaterial',
    'myApp.homeView',
  ])
  .config([ '$locationProvider', '$routeProvider',
    function ($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('!');
      $routeProvider.otherwise({ redirectTo: '/' });
    } ])
  .config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
    $mdThemingProvider.theme('dark-orange').backgroundPalette('orange').dark();
    $mdThemingProvider.theme('dark-purple').backgroundPalette('deep-purple').dark();
    $mdThemingProvider.theme('dark-blue').backgroundPalette('blue').dark();
  })
  .controller('NavCtrl', function ($scope, $rootScope, $location) {
    $scope.location = $location.path();
    $rootScope.$on('$routeChangeSuccess', function () {
      $scope.location = $location.path();
    });
  });