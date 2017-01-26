app.factory('config', function ($rootScope, $http) {
	var config = {
		firebase: {
			apiKey: "AIzaSyButsYy9JIsp0mwsa_TCWz8Jsi8STDpiJY",
			authDomain: "teachtobe-6eb2f.firebaseapp.com",
			databaseURL: "https://teachtobe-6eb2f.firebaseio.com",
			storageBucket: "teachtobe-6eb2f.appspot.com",
			messagingSenderId: "284993844867"
		}
	}
	firebase.initializeApp(config.firebase);
	// var config = {
	// 	fireRoot: 			'https://ilt.firebaseio.com/',
	// 	fireRef: 			new Firebase('https://ilt.firebaseio.com/'),
	// 	parseRoot: 			'https://api.parse.com/1/',
	//  	parseAppId: 		'8gFhhBD8E2cWOMmkAMwbDB8JEnDfwtfhnpsOpkDu',
	//  	parseJsKey: 		'0xGYv7ajkmDcVWbPTnKCFXkZeeIRM5rEspuTineI',
	//  	parseRestApiKey: 	'SGOvn51LTQ9KJVD2Y2EPQAGVfoLJ9qwEgx5NN8Jn',
	//  	roles: 				['Manager','Director','Coordinator','Facilitator']
	// };

	// Parse.initialize(config.parseAppId, config.parseJsKey);
	//  $http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	//  $http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	//  $http.defaults.headers.common['Content-Type'] = 'application/json';

	return config;
});