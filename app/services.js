app.factory('userService', function ($rootScope, $http, $q, config) {
	var userService = {
 		init:function(){
 			if($rootScope.user==undefined){
	 			if(navigator.onLine){
	 				userService.auth = new FirebaseSimpleLogin(config.fireRef, function(error, data) {
	 					if (error) {
	 						console.log(error);
	 					} else if (data) {
							// console.log('FireAuth has been authenticated!')
							$('#userLoginModal').modal('hide');
							if(localStorage.user){
								var localUser = angular.fromJson(localStorage.user);
								$http.defaults.headers.common['X-Parse-Session-Token'] = localUser.sessionToken;
							}
							userService.initParse(data);
						} else {
							// console.log('not logged in.');
							$rootScope.$broadcast('authError');
						}
					});
	 			}else{
	 				alert('You are not online!')
	 			}
	 		}
 		},
 		initParse:function(){
 			$http.get(config.parseRoot+'users/me').success(function(data){
 				$rootScope.$broadcast('authenticated', data);
 				userService.getRoles(data).then(function(roles){
 					data.roles = roles;
	 				$rootScope.user=data;
	 				
	 				if(roles[0] && roles[0].name=='Facilitator')
	 					window.location.hash='#/home'
	 				console.log(roles)
	 				// $rootScope.user.isAdmin = userService.is('Admin')
	 				// $rootScope.user.isManager = userService.is('Manager')
	 				// $rootScope.user.isDirector = userService.is('Director')
	 				// $rootScope.user.isCoordinator = userService.is('Coordinator')
	 				// $rootScope.user.isFacilitator = userService.is('Facilitator')
 				})
 			}).error(function(){
				alert('You are not authenticated any more!');
			});
 		},
 		signupModal:function(){
 			$('#userSignupModal').modal('show');
 		},
 		signup:function(user){
 			userService.signupParse(user);
 		},
 		signupParse:function(user){
 			user.username = user.email;
 			if(user.password!=user.password1){
 				console.error('error','Your passwords do not match.');
 			}else{
 				delete user.password1;
 				$http.post('https://api.parse.com/1/users', user).success(function(data){
 					userService.signupFire(user);
 				}).error(function(error, data){
 					console.log('signupParse error: ',error,data);
 				});
 			}
 		},
 		signupFire:function(user){
 			userService.auth.createUser(user.email, user.password, function(error, data) {
 				if(error)
 					console.log('signupFire error: ',error,data)
 				else{
 					$('#userSignupModal').modal('hide');
 					//CUSTOM EDIT
 					window.location.hash='#/newMember'
 					userService.login(user);
 				}
 			});
 		},
 		loginModal:function(){
 			$('#userLoginModal').modal('show');
 		},
 		login:function(user){
 			if(!user.email){
				user.email = $("#email").val();
				user.password = $("#password").val();
			}
 			userService.loginParse(user);
 		},
 		loginParse:function(user){
 			var login = {
 				username:user.email,
 				password:user.password
 			}
 			$http.get("https://api.parse.com/1/login", {params: login}).success(function(data){
 				$http.defaults.headers.common['X-Parse-Session-Token'] = data.sessionToken;
 				localStorage.user=angular.toJson(data);
 				$rootScope.user=data;
 				userService.loginFire(user);
 			}).error(function(data){
 				console.error('error',data.error);
				// $('#loading').removeClass('active');
			});
 		},
 		loginFire:function(user){
 			userService.auth.login('password', {
 				email: user.email,
 				password: user.password
 			});
 		},
 		logout:function(){
 			localStorage.clear();
 			$rootScope.user=null;
 		},
 		getRoles:function(user){
			var deferred = $q.defer();
			var roleQry = 'where={"users":{"__type":"Pointer","className":"_User","objectId":"'+user.objectId+'"}}'
			$http.get(config.parseRoot+'classes/_Role?'+roleQry).success(function(data){
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		is:function(roleName){
			if($rootScope.user && $rootScope.user.roles)
				for(var i=0; i<$rootScope.user.roles.length; i++)
					if($rootScope.user.roles[i].name==roleName)
						return true;
			return false;
		},
 		settingsModal:function(){
 			$('#userSettingsModal').modal('show');
 		}
 	}
	it.userService = userService;
	return userService;
});










app.factory('roleService', function ($rootScope, $http, $q, config) {
	var userList = [];
	var roleList = [];
	var unassigned = false;
	var roleService = {
		reassign:function(){
			var deferred = $q.defer();
			roleService.listUsers().then(function(users){
				var users = angular.fromJson(angular.toJson(users))
				var assignedUsers = [];
				for(var i=0; i<roleList.length; i++)
					for(var u=0; u<roleList[i].users.length; u++)
						assignedUsers.push(roleList[i].users[u].objectId)	

				unassigned = [];
				for(var i=0; i<users.length; i++)
					if(assignedUsers.indexOf(users[i].objectId) == -1)
						unassigned.push(users[i])

				$rootScope.$broadcast('role-reassigned', unassigned)
				deferred.resolve(unassigned);
			})
			return deferred.promise;
		},
		unassigned:function(){
			var deferred = $q.defer();
			if(unassigned){
				deferred.resolve(unassigned);
			}else{
				roleService.reassign().then(function(){
					deferred.resolve(unassigned);
				});
			}
			return deferred.promise;
		},
		detailedRoles:function(){
			var deferred = $q.defer();
			roleService.listRoles().then(function(roles){
				$rootScope.data.roles = [];
				var listToGet = [];
				for(var i=0; i<roles.length; i++){
					listToGet.push(roleService.roleUserList(roles[i]))
				}
				$q.all(listToGet).then(function(roles){
					roleList = roles;
					deferred.resolve(roles);
				})
			})
			return deferred.promise;
		},
		listRoles:function(){
			var deferred = $q.defer();
			$http.get(config.parseRoot+'classes/_Role').success(function(data){
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		roleUserList:function(role){
			var deferred = $q.defer();
			var roleQry = 'where={"$relatedTo":{"object":{"__type":"Pointer","className":"_Role","objectId":"'+role.objectId+'"},"key":"users"}}'
			$http.get(config.parseRoot+'classes/_User?'+roleQry).success(function(data){
				role.users = data.results;
				deferred.resolve(role);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		listUsers:function(){
			var deferred = $q.defer();
			$http.get(config.parseRoot+'classes/_User').success(function(data){
				userList = data.results;
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		toggleUserRole:function(user,role){
			if(roleService.hasRole(user,role))
				roleService.deleteUserRole(user,role)
			else
				roleService.addUserRole(user,role)
		},
		addUserRole:function(user,role){
			var deferred = $q.defer();
			var request = {
				users: {
					"__op": "AddRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": user.objectId
					}]
				}
			}
			$http.put(config.parseRoot+'classes/_Role/'+role.objectId, request).success(function(data){
				role.users.push(user);
				roleService.reassign();
				deferred.resolve(data);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		deleteUserRole:function(user,role){
			var deferred = $q.defer();
			var request = {
				users: {
					"__op": "RemoveRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": user.objectId
					}]
				}
			}
			$http.put(config.parseRoot+'classes/_Role/'+role.objectId, request).success(function(data){
				role.users.splice(role.users.indexOf(user), 1)
				roleService.reassign();
				deferred.resolve(data);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		hasRole:function(user, role){
			if(user && role)
				for(var i=0; i<role.users.length; i++)
					if(user.objectId==role.users[i].objectId)
						return true
			return false;
		},
		roleList:function(){
			return roleList;
		}
	}
	it.roleService = roleService;
	return roleService;
});












app.factory('fileService', function ($http, config) {
	var fileService = {
		upload:function(details,b64,successCallback,errorCallback){
			var file = new Parse.File(details.name, { base64: b64});
			file.save().then(function(data) {
				it.fileData = data;
				console.log('save success',data)
				if(successCallback)
					successCallback(data);
			}, function(error) {
				console.log('save error',error)
				if(errorCallback)
					errorCallback(error)
			});
		}
	}

	it.fileService = fileService;
	return fileService;
});













app.factory('initSetupService', function($rootScope, $http, $q, config){
	//1st time admin user login
	//Setup permissions and assign 1st user as admin
	var privateData = {}
	var initSetupService = {
		setup:function(user, roleList){
			var deferred = $q.defer();
			if(!user || !user.objectId){
				console.error('You must create an account before you can setup roles.')
				deferred.reject();
			}else{
				var createdRoles = [];
				var superAdmin = user.objectId;
				initSetupService.setAdminRole(superAdmin).then(
					function(adminRole){
						privateData.adminRole = adminRole;
						createdRoles.push(adminRole);
						roleSetupArray = [];
						for(var i=0; i<roleList.length; i++)
							roleSetupArray.push(initSetupService.setOtherRole(roleList[i]))
						$q.all(roleSetupArray).then(function(data){
							for(var i=0; i<data.length; i++)
								createdRoles.push(data[i]);
							deferred.resolve(createdRoles);
						});
					}
				)
			}
			return deferred.promise;
		},
		setAdminRole:function(superAdmin){
			var deferred = $q.defer();
			var adminRole = {
				name: 'Admin',
				ACL: {
					"*":{
						read: true
					}
				},
				users: {
					"__op": "AddRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": superAdmin
					}]
				}
			};
			adminRole.ACL[superAdmin] = {
				read: true,
				write: true
			}
			$http.post('https://api.parse.com/1/classes/_Role', adminRole).success(function(data){
				adminRole.response = data;
				deferred.resolve(adminRole);
			}).error(function(error, data){
				deferred.reject({error:error,data:data});
			});

			return deferred.promise;
		},
		setOtherRole:function(roleName){
			var deferred = $q.defer();
			var roleParams = {
				name: roleName,
				ACL: {
					"*":{
						read: true
					},
					"role:Admin":{
						read: true,
						write: true
					}
				},
				roles: {
					"__op": "AddRelation",
					"objects": [
					{
						"__type": "Pointer",
						"className": "_Role",
						"objectId": privateData.adminRole.response.objectId
					}
					]
				}
			};
			$http.post('https://api.parse.com/1/classes/_Role', roleParams).success(function(data){
				roleParams.response = data;
				deferred.resolve(roleParams);
			}).error(function(error, data){
				$scope.response = {error:error,data:data};
				deferred.reject({error:error,data:data});
			});

			return deferred.promise;
		}
	}
	it.initSetupService = initSetupService;
	return initSetupService;
});











app.factory('dataService', function ($rootScope, $http, $q, config) {
	var dataStore = {};
	var tools = {
		loadData:function(type){
			var deferred = $q.defer();
			$http.get(config.parseRoot+'classes/'+type).success(function(data){
				dataStore[type] = data.results;
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		list:function(type){
			var deferred = $q.defer();
			if(dataStore[type])
				deferred.resolve(dataStore[type]);
			else
				tools.loadData(type).then(function(data){
					deferred.resolve(data);
				})
			return deferred.promise;
		},
		get:function(type, id){
			if(dataStore[type])
				for(var i=0; i<dataStore[type].length; i++)
					if(dataStore[type][i].objectId==id){
						dataStore[type][i].i = i+1;
						return dataStore[type][i]
					}
		},
		add:function(type, object){
			$http.post(config.parseRoot+'classes/'+type, object).success(function(data){
				tools.loadData(type).then(function(newList){
					$rootScope.$broadcast("update-"+type, newList);
				})
			}).error(function(error, data){
				console.error(error,data);
			});
		},
		update:function(type, object){
			var objectId = object.objectId;
			delete object.objectId;
			$http.put(config.parseRoot+'classes/'+type+'/'+objectId, object).success(function(data){
				tools.loadData(type).then(function(newList){
					$rootScope.$broadcast("update-"+type, newList);
				})
			}).error(function(error, data){
				console.error(error,data);
			});
		},
		remove:function(type, object){
			if(confirm('Are you sure you want to delete the '+type+': '+object.title+'?')){
				$http.delete(config.parseRoot+'classes/'+type+'/'+object.objectId).success(function(data){
					tools.loadData(type).then(function(newList){
						$rootScope.$broadcast("update-"+type, newList);
					})
				}).error(function(error, data){
					console.error(error,data);
				});
			}
		}
	}

	it.tools = tools;
	return tools;
});




app.factory('resourceService', function ($rootScope, $q, $timeout, dataService) {
	var tools = {
		isActive:function(resource){
			if(resource.topics.indexOf($rootScope.id) != -1)
				return 'active';
		},
		getTopic:function(objectId){
			for(var i=0; i<$rootScope.data.topics.length; i++)
				if($rootScope.data.topics[i].objectId==objectId)
					return $rootScope.data.topics[i];
		},
		get:function(objectId){
			var deferred = $q.defer();
			for(var i=0; i<$rootScope.data.resources.length; i++)
				if($rootScope.data.resources[i].objectId==objectId)
					deferred.resolve($rootScope.data.resources[i]);
			return deferred.promise;
		},
		focus:function(resource){
			$rootScope.temp.resource = resource;
			// ga('send', 'event', 'resource', resource.category, resource.title);
			mixpanel.track(
				"Resource Viewed",
				{
					"Category": resource.category,
					"Title": 	resource.title
				}
			);
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
				// else(resource.category=='Scripture')
				// 	$timeout(function(){
				// 		autofit($('.autofit')[0])
				// 	}, 1000);
			}
		},
		add:function(category){
			$rootScope.temp.resource = {
				category: category
			}
			$('#resourceAddModal').modal('show');
		},
		save:function(resource){
			if(resource.objectId)
				dataService.update('resource',resource);
			else
				dataService.add('resource',resource);
		},
		remove:function(resource){
			dataService.remove('resource',resource);
		},
		organize:function(){
			$rootScope.data.organized = {};
			for(var i=0; i<$rootScope.data.topics.length; i++)
				$rootScope.data.topics[i].resources = [];
			for(var i=0; i<$rootScope.data.categories.length; i++)
				$rootScope.data.organized[$rootScope.data.categories[i]] = [];
			for(var i=0; i<$rootScope.data.resources.length; i++){
				var resource = $rootScope.data.resources[i];
				var newTopics = [];
				if(resource.topics){
					for(var t=0; t<resource.topics.length; t++){
						var topic = tools.getTopic(resource.topics[t])
						newTopics.push(topic)
						topic.resources.push(resource)
					}
				}
				resource.topicObj = newTopics;
				$rootScope.data.organized[$rootScope.data.resources[i].category].push(resource)
			}
		},
		send:function(resource){
			if($rootScope.remote){
				$rootScope.remote.set({resource:resource.objectId})
				// ga('send', 'event', 'remoteControl', 'resource', resource.title);
				mixpanel.track(
					"Remote Control",
					{ 
						"Media": "Resource",
						"Title": 	resource.title 
					}
				);
			}
		}
	}

	it.tools = tools;
	return tools;
});








app.factory('navigateService', function ($rootScope) {
	return {
		getTopic:function(id){
			for(var i=0; i<$rootScope.data.topics.length; i++)
				if($rootScope.data.topics[i].objectId==id)
					return $rootScope.data.topics[i];
		},
		navigate:function(direction, fromRemote){
			var currentIndex = $rootScope.data.clickPath.indexOf($rootScope.view);
			var comeFrom = $rootScope.view;
			var goTo;

			
			function topicIndex(id){
				for(var i=0; i<$rootScope.data.topics.length; i++)
					if($rootScope.data.topics[i].objectId==id)
						return i;
			}
			function navigateTop(){
				if(currentIndex == -1)
					return $rootScope.data.clickPath[0];
				else if(direction == 'previous' && currentIndex != 0)
					return $rootScope.data.clickPath[currentIndex-1]
				else if(direction == 'next' && currentIndex < $rootScope.data.clickPath.length-1)
					return $rootScope.data.clickPath[currentIndex+1]
				else
					return 'hummmm'
			}
			function navigateTopics(){
				var tIndex = topicIndex($rootScope.id);
				if(tIndex == -1)
					return $rootScope.data.topics[0];
				else if(direction == 'previous')
					if(tIndex != 0)
						return 'topic/'+$rootScope.data.topics[tIndex-1].objectId
					else
						return navigateTop();
					else if(direction == 'next')
						if(tIndex < $rootScope.data.topics.length-1)
							return 'topic/'+$rootScope.data.topics[tIndex+1].objectId
						else
							return navigateTop();
						else
							return 'topicList'
			}

			if(direction=='previous' || direction=='next'){
				goTo = navigateTop();
				if(goTo=='topic'){
					if(direction=='next')
						goTo += '/'+$rootScope.data.topics[0].objectId;	//Go to first topic
					else if(direction=='previous')
					goTo += '/'+$rootScope.data.topics[$rootScope.data.topics.length-1].objectId;	//Go to last topic
				}else if(comeFrom=='topic'){
					goTo = navigateTopics(direction)
				}
			}else{
				goTo = direction;
			}

			if(goTo != 'hummmm')
				window.location.hash = '#/'+goTo;
			if($rootScope.remote){
				if(fromRemote){
					$rootScope.remote.child('location').set(goTo)
				}
			}
		}
	}
});