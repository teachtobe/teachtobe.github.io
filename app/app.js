var it = {};

var app = angular.module('ILT', ['firebase','ngAnimate','ngResource','ngRoute'])
.config(function($routeProvider, $locationProvider) {
	$locationProvider
		.html5Mode(false)
		.hashPrefix('');
		
	$routeProvider
		.when('/:view', {
			templateUrl: function($routeParams){
				return 'views/'+$routeParams.view+'.html'
			},
			controller: 'MainCtrl'
		})
		.when('/:view/:id', {
			templateUrl: function($routeParams){
				return 'views/'+$routeParams.view+'.html'
			},
			controller: 'MainCtrl'
		})
		.otherwise({
			redirectTo: 'welcome'
		});

	// $translateProvider.useStaticFilesLoader({
	// 	prefix: 'assets/languages/',
	// 	suffix: '.json'
	// });
	// $translateProvider.uses('en');
});

angular.element(document).ready(function() {
	angular.bootstrap(document, ['ILT']);
});