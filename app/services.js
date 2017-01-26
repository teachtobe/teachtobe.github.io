app.factory('Auth', function ($rootScope, $q, $firebaseAuth, $firebaseObject) {
	var signin = $q.defer();
	$firebaseAuth().$onAuthStateChanged(function(user){
		if(user){
			
			var actRef = firebase.database().ref().child('site/private/accounts').child(user.uid);
				actRef.set(user.toJSON())
			
			var roleRef = firebase.database().ref().child('site/public/roles').child(user.uid);
			var roleObj = $firebaseObject(roleRef);
			roleObj.$loaded().then(function(){
				user.roles = roleObj || {};
				user.is = function(role){
					return !!user.roles[role]
				}
				user.jwt = function(){
					return firebase.auth().currentUser.getToken(true)
				}
				$rootScope.user = user;
				signin.resolve(user)
			});
		}
	})
	function userAuth(){
		return signin.promise;
	}
	userAuth.login =  function(type){
		type = type || 'google';
		$firebaseAuth().$signInWithPopup(type);
	}
	return userAuth;
})















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