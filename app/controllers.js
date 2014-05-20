var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $http, $routeParams, $location, $window, config, userService, resourceService, navigateService){
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	if(!$rootScope.data){
		$rootScope.temp={};
		$rootScope.side={};
		$rootScope.mode='normal';
		$rootScope.data={
			topics:[],
			resources:[],
			organized: {},
			categories:['Scripture','Quote','Video'],
			clickPath: ['welcome','agenda','introduction','topicList','topic','resourceList','overview','recomendation','review']
		};
		$http({method: 'GET', url: 'assets/json/hymns.json'}).success(function(data) {
			$rootScope.data.hymns=data.playlist.list;
		});
	}
	it.resourceService = resourceService;

	$scope.$on('$viewContentLoaded', function(event) {
		// ga('send', 'pageview', $location.path());
		mixpanel.track(
			"Clicked Link",
			{
				"Path": 	$location.path()
			}
		);
	});
	$rootScope.$on('authenticated', function(event,user) {
		mixpanel.identify(user.objectId);
		mixpanel.people.set({ "Name": user.name });
		mixpanel.people.set({ "Email": user.email });
		$rootScope.remote = config.fireRef.child('remote').child(user.objectId);
		$rootScope.$broadcast('fb-connected', $rootScope.remote);
		$rootScope.remote.on("value", function(update) {
			// $rootScope.$apply(function(){
				$rootScope.data.presentation = update.val();
				var presentation = $rootScope.data.presentation
				var direction = presentation.direction
				var resource = presentation.resource
				if($rootScope.view!='remote'){
					if(direction)
						navigateService.navigate(direction)
					if(resource){
						var newResource = resourceService.get(resource).then(function(newResource){
							console.log(newResource)
							resourceService.focus(newResource)
						})
					}else{
						$('#resourceViewModal').modal('hide');
					}
				}
			// });
		});
	});

	var tools = {
		user: userService,
		navigate: navigateService,
		url:function(){
			if($scope.user)
				if(tools.canView())
					return 'views/'+$routeParams.view+'.html';
				else
					return 'views/newMember.html';
			else
				return 'views/welcome.html';
		},
		side:function(side, url){
			if(url)
				$rootScope.side[side]=url;
			else
				return $rootScope.side[side]
		},
		mode:function(mode){
			if($rootScope.mode==mode){
				// ga('send', 'event', 'mode', 'leave', mode);
				mixpanel.track(
					"Mode Changed",
					{ 
						"From": $rootScope.mode,
						"To": 	'normal' 
					}
				);
				$rootScope.mode = 'normal';	// v- Assign Mode
				if(mode=='presentation'){
					var el = document.documentElement
					, rfs =
						el.requestFullScreen
						|| el.webkitRequestFullScreen
						|| el.mozRequestFullScreen
					rfs.call(el);
				}
			}else{
				// ga('send', 'event', 'mode', 'enter', mode);
				mixpanel.track(
					"Mode Changed",
					{ 
						"From": $rootScope.mode,
						"To": 	mode 
					}
				);
				$rootScope.mode = mode;		// ^- Assign Mode
			}
		},
		setup:function(){
			$(".tagline").fitText(1.1, { minFontSize: '22px', maxFontSize: '75px' });
			tools.side('left','partials/side/topics.html')
			tools.side('right','partials/side/resources.html')
			$('.present').each(function(index, elem){
				elem.addEventListener("click", function() {
					var el = document.documentElement
					, rfs =
						el.requestFullScreen
						|| el.webkitRequestFullScreen
						|| el.mozRequestFullScreen
					rfs.call(el);
				});
			})

			tools.registerKeypress();
		},
		registerKeypress:function(){
			if(!$rootScope.keyListen){
				$rootScope.keyListen = new window.keypress.Listener();
				var my_scope = this;
				var my_combos = [{
					keys: 				"left",
					on_keyup: 			function(event) {
						if($rootScope.mode!='study' && $rootScope.mode!='edit')
							navigateService.navigate('previous');
					}
				},{
					keys: 				"up",
					on_keyup: 			function(event) {
						if($rootScope.mode!='study' && $rootScope.mode!='edit')
							navigateService.navigate('previous');
					}
				},{
					keys: 				"right",
					on_keyup: 			function(event) {
						if($rootScope.mode!='study' && $rootScope.mode!='edit')
							navigateService.navigate('next');
					}
				},{
					keys: 				"down",
					on_keyup: 			function(event) {
						if($rootScope.mode!='study' && $rootScope.mode!='edit')
							navigateService.navigate('next');
					}
				}];
				$rootScope.keyListen.register_many(my_combos);
			}
		},
		canView: function(){
			return (
				userService.is('Admin') 
				|| userService.is('Manager') 
				|| userService.is('Director') 
				|| userService.is('Coordinator')
				|| userService.is('Facilitator')
			)
		},
		canEdit: function(){
			return (
				userService.is('Admin') 
				|| userService.is('Manager') 
				|| userService.is('Director') 
				|| userService.is('Coordinator')
			)
		}
	}
	$scope.tools = tools;

	userService.init();
	tools.setup();
	it.MainCtrl=$scope;
});














var AgendaCtrl = app.controller('AgendaCtrl', function($rootScope, $scope, userService, dataService){
	$scope.tools = {
		music:{
			playing:false,
			play:function(musicIndex){
				// ga('send', 'event', 'agenda', 'playMusic', musicIndex
				mixpanel.track(
					"Agenda Used",
					{ 
						"To": 'Play Music',
						"Song Number": 	musicIndex 
					}
				);
				var item = $scope.data.hymns[musicIndex]
				if(item.alturl!=undefined){
					this.playing = new Audio(item.alturl.split('?download=')[0]);
					this.playing.play();
				}
			},
			pause:function(){
				this.playing.pause();
			}
		}
	}

	it.AgendaCtrl=$scope;
});













var TopicCtrl = app.controller('TopicCtrl', function($rootScope, $scope, userService, dataService, resourceService){
	$scope.$on('authenticated', function(data) {
		dataService.list('topic').then(function(topics){
			$scope.data.topics = topics;
		})
	});

	$scope.tools = {
		user: userService,
		topic: dataService,
		getTopic:function(objectId){
			for(var i=0; i<$scope.data.topics.length; i++)
				if($scope.data.topics[i].objectId==objectId)
					return $scope.data.topics[i];
		},
		setTopic: function(){
			dataService.list('topic').then(function(topics){
				$scope.topic = dataService.get('topic', $scope.id)
			});
		},
		listResources: function(topic, category){
			var resources = [];
			if(topic.resources)
				for(var i=0; i<topic.resources.length; i++)
					if(topic.resources[i].category==category)
						resources.push(topic.resources[i])
			return resources;
		}
	}

	$rootScope.$on("update-topic", function(event,newList){
		$scope.data.topics = newList;
		$scope.temp.topic = {};
	});

	it.TopicCtrl=$scope;
});









var ResourceCtrl = app.controller('ResourceCtrl', function($rootScope, $scope, userService, dataService, resourceService){
	$scope.$on('authenticated', function() {
		dataService.list('topic').then(function(topics){
			$scope.data.topics = topics;
			dataService.list('resource').then(function(resources){
				$scope.data.resources = resources;
				$scope.tools.resource.organize();
			})
		})
	});

	$scope.tools = {
		user: userService,
		resource: resourceService,
		setResource: function(){
			dataService.list('resource').then(function(resources){
				$scope.resource = dataService.get('resource', $scope.id)
			});
		}
	}

	$rootScope.$on("update-resource", function(event,newList){
		$scope.data.resources = newList;
		$scope.tools.resource.organize();
		$scope.temp.resource = {};
		$('#resourceAddModal').modal('hide');
	});

	it.ResourceCtrl=$scope;
});






var RemoteCtrl = app.controller('RemoteCtrl', function($rootScope, $scope, config, resourceService){
	console.log('RemoteCtrl')

	$scope.tools = {
		control:function(direction){
			if($rootScope.remote)
				$rootScope.remote.set({direction:direction})
		},
		preview:function(resource){
			resourceService.focus(resource)
		}
	}

	it.RemoteCtrl=$scope;
});











var AdminCtrl = app.controller('AdminCtrl', function($rootScope, $scope, $http, $q, config, initSetupService, roleService){
	var tools = {
		email:function(fun){
			$http.post(config.parseRoot+'functions/'+fun, {}).success(function(data){
				$scope.response = data;
			}).error(function(error, data){
				$scope.response = {error:error,data:data};
			});
		},
		setup:function(){
			roleService.detailedRoles().then(function(roles){
				$rootScope.data.roles = roles;
				roleService.unassigned().then(function(unassigned){
					$rootScope.data.unassigned = unassigned;
				})
			})
		},
		userRoles:roleService,
		user:{
			editRoles:function(user){
				$rootScope.temp.user = user;
				$('#adminUserModal').modal('show');
				// ga('send', 'event', 'admin', 'editRoles');
				mixpanel.track(
					"View Roles",
					{ 
						"For": user.name
					}
				);
			}
		},
		roles:{
			setup:function(){	//This is a one time only thing - used to initiate the website roles.
				initSetupService.setup($rootScope.user,config.roles).then(function(results){
					$rootScope.data.roles = results;
				})
			}
		}
	}

	tools.setup();
	$scope.$on('authenticated', function() {
		tools.setup();
	})
	$rootScope.$on('role-reassigned', function(event,unassigned){
		$rootScope.data.unassigned = unassigned;
	})
	$scope.tools = tools;
	it.AdminCtrl=$scope;
});