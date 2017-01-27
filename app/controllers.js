var MainCtrl = app.controller('MainCtrl', function($rootScope, $http, $routeParams, $location, $timeout, $q, $window, $firebaseArray, $firebaseObject, config, Auth, navigateService){
	
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	if(!$rootScope.data){
		$rootScope.temp={};
		$rootScope.side={};
		$rootScope.mode='normal';
		$rootScope.data={
			topics:[],
			resources:[],
			organized:{},
			categories:['Scripture','Quote','Video'],
			clickPath: ['welcome','agenda','introduction','topicList','topic','resourceList','overview','recomendation','review']
		};
		$http.get('assets/json/hymns.json').then(function(data) {
			if(data && data.playlist)
				$rootScope.data.hymns=data.playlist.list;
		});
	}
	
	Auth().then(function(user){
		var presentRef = firebase.database().ref().child("presentation").child(user.uid);
		var presentation = $rootScope.presentation = $firebaseObject(presentRef);
		presentation.$loaded(function(){
			if(window.location.hash!= '#/remote'){
				presentation.slide = window.location.hash.split('#/')[1];
				// presentation.history = presentation.history || [];
				// presentation.history.push({
				// 	date: new Date().toISOString(),
				// 	slide: presentation.slide
				// })
				presentation.$save();
			}
			presentation.$watch(function(r){
				if($routeParams.view != 'remote'){
					var part = presentation.slide.split('/');
					if(part[0] == 'resource'){
						var resourceId = presentation.slide.split('/')[1];
						tools.resource.focus(tools.resource.get(resourceId));
					}else if(part[0] == 'action'){
						if(part[1] == 'close')
							$('#resourceViewModal').modal('hide');
					}else{
						window.location = '#/'+presentation.slide
					}
				}
			})
		})
	})
	
	var topicRef = firebase.database().ref().child("lesson/ilt/topics");
	var topics = $rootScope.data.topics = $firebaseArray(topicRef);
	
	var resourceRef = firebase.database().ref().child("lesson/ilt/resources");
	var resources = $rootScope.data.resources = $firebaseArray(resourceRef);
	resources.$loaded(function(r){
		tools.resource.list(r)
	})


	var tools = {
		navigate: navigateService,
		user: Auth,
		resource: {
			get: function(resourceId){
				return $rootScope.data.resources.$getRecord(resourceId);
			},
			list: function(resources){
				var organized = {};
				$rootScope.data.categories.forEach(function(c){
					organized[c] = {
						title:		c,
						resources:	[]
					}
				})
				resources.forEach(function(r){
					organized[r.category].resources.push(r);
				})
				$rootScope.data.organized = organized;
			},
			paint: function(resource){
				if(resource.topics && resource.topics.indexOf($rootScope.id) != -1)
					return 'active';
			},
			focus: function(resource){
				$rootScope.temp.resource = resource;
				if($rootScope.mode=='edit'){
					delete $rootScope.temp.resource.topicObj;
					$('#resourceAddModal').modal('show');
				}else{
					$('#resourceViewModal').on('hidden.bs.modal', function () {
						$('#videoPlayer').html('');
					}).modal('show');
					if(resource.category=='Video')
						$('#videoPlayer').html('<iframe width="560" height="315" src="'+resource.refrence+'" frameborder="0"></iframe>')
					else if(resource.category=='Quote'){
						$($($('.autofit')[0]).children('h2')[0]).css('color', '#FFF');
						$timeout(function(){
							autofit($('.autofit')[0])
						}, 500);
					}
				}
			},
			save: function(resource){
				var id = resource.$id;
				resource = angular.copy(resource)
				delete resource.$id;
				delete resource.$priority;
				$rootScope.data.resources.$ref().child(id).set(resource).then(function(r){
					$('#resourceAddModal').modal('hide');
				}).catch(function(e){
					alert(e)
				})
			}
		},
		topic: {
			init: function(){
				$rootScope.data.topics.$loaded(function(){
					$rootScope.topic = $rootScope.data.topics.$getRecord($routeParams.id);
				})
			},
			get: function(topic){
				return $rootScope.data.topics.$getRecord(topic);
			}
		},
		admin: {
			init: function(){
				var actRef = firebase.database().ref().child("site/private/accounts");
				$rootScope.users = $firebaseArray(actRef);
			},
			focus: function(user){
				$rootScope.temp.user = user;
				var roleRef = firebase.database().ref().child('site/public/roles').child(user.uid);
				$rootScope.temp.roles = $firebaseArray(roleRef);
			},
			roleAdd: function(user){
				var role = prompt('Enter role to assign.')
				$rootScope.temp.roles.$ref().child(role).set(true);
			},
			roleRemove: function(user, role){
				if(confirm('Are you sure you want to remove this user from this role?'))
				$rootScope.temp.roles.$remove(role)
			}
		},
		remote: {
			control: function(action){
				$rootScope.presentation.slide = action;
				$rootScope.presentation.$save();
			}
		},
		url: function(){
			if($rootScope.user)
				if(tools.canView())
					return 'views/'+$rootScope.view+'.html';
				else
					return 'views/newMember.html';
			else
				return 'views/welcome.html';
		},
		side:function(side, url){
			if(url)
				$rootScope.side[side]=url;
			else
				if($rootScope.user)
					return $rootScope.side[side]
				else
					return false;
		},
		mode:function(mode){
			if($rootScope.mode==mode){
				$rootScope.mode = 'normal';
				if(mode=='presentation'){
					var el = document.documentElement
					, rfs =
						el.requestFullScreen
						|| el.webkitRequestFullScreen
						|| el.mozRequestFullScreen
					rfs.call(el);
				}
			}else{
				$rootScope.mode = mode;
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
			if($rootScope.user)
				return (
					$rootScope.user.is('admin') 
					|| $rootScope.user.is('manager') 
					|| $rootScope.user.is('director') 
					|| $rootScope.user.is('coordinator')
					|| $rootScope.user.is('facilitator')
				)
		},
		canEdit: function(){
			if($rootScope.user)
				return (
					$rootScope.user.is('admin') 
					|| $rootScope.user.is('manager') 
					|| $rootScope.user.is('director') 
					|| $rootScope.user.is('coordinator')
				)
		}
	}
	$rootScope.tools = tools;
	tools.setup();
	it.MainCtrl=$rootScope;
});














var AgendaCtrl = app.controller('AgendaCtrl', function($rootScope, $scope, $http){
	$http.get('/assets/json/hymns.json').then(function(response){
		$scope.hymns = response.data.playlist.list;
	})
	$scope.tools = {
		music:{
			playing:false,
			play:function(musicIndex){
				var item = $scope.hymns[musicIndex]
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