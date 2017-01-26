app.directive('contenteditable', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {

			elm.bind('blur', function() {
				scope.$apply(function() {
					ctrl.$setViewValue(elm.html());
				});
			});

			ctrl.$render = function() {
				elm.html(ctrl.$viewValue);
			};
		}
	};
});

app.directive('notes', ['$firebaseArray', function($firebaseArray) {
	return {
		restrict: 		'E',
		replace: 		true,
		transclude: 	true,
		templateUrl:		'partials/notes.html',
		scope: {
			show: 		'=show',
			category: 	'=category',
			topic: 		'=topic'
		},
		link: function(scope, elem, attrs, ctrl) {
			scope.$on("update-note", function(event,newList){
				// scope.notes = newList;
				// scope.temp.note = {};
			});

			scope.tools = {
				fromParse:function(){
					// dataService.list('note').then(function(notes){
					// 	scope.notes = notes;
					// 	console.log('new notes',notes)
					// })
				},
				add:function(note){
					// note.category = scope.category;
					// note.topic = scope.topic;
					// dataService.add('note',note);
				},
				remove:function(note){
					// dataService.remove('note',note);
				}
			}
			scope.tools.fromParse();
		}
	};
}]);