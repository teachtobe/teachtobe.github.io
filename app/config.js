app.factory('config', function ($rootScope, $http) {
	var config = {
		fireRoot: 			'https://ilt.firebaseio.com/',
		fireRef: 			new Firebase('https://ilt.firebaseio.com/'),
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'8gFhhBD8E2cWOMmkAMwbDB8JEnDfwtfhnpsOpkDu',
	 	parseJsKey: 		'0xGYv7ajkmDcVWbPTnKCFXkZeeIRM5rEspuTineI',
	 	parseRestApiKey: 	'SGOvn51LTQ9KJVD2Y2EPQAGVfoLJ9qwEgx5NN8Jn',
	 	roles: 				['Manager','Director','Coordinator','Facilitator']
	};

	Parse.initialize(config.parseAppId, config.parseJsKey);
	 $http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	 $http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	 $http.defaults.headers.common['Content-Type'] = 'application/json';

	return config;
});