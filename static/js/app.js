var app = angular.module('app', ['ui.bootstrap', 'ngGrid', 'ngResource'],  
                         function ($interpolateProvider, $httpProvider) {
        $interpolateProvider.startSymbol('{[');
        $interpolateProvider.endSymbol(']}');
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    });

app.controller('ModelsCtrl', function ($scope, $resource) {
    $scope.models = models;
    $scope.resources = {}

    angular.forEach($scope.models, function (value, key) {
       this[key] = $resource('/api/' + key.toLowerCase() + '/:id', null, 
                             {update: {method: 'PUT', isArray: false}});
     }, $scope.resources);

    $scope.$watch('currentModel.id', function (newModel) {
        if (newModel) {
            $scope.gridData = $scope.resources[newModel].query();
            $scope.gridDefs = [{field: 'id', displayName: 'ID'}]
            angular.forEach($scope.models[newModel]['schema'], function (el) {
               this.push({field: el['id'], displayName: el['title'], enableCellEdit: true});
             }, $scope.gridDefs);
        }
    });
    $scope.currentModel = {id: "Users"};

    $scope.gridData = [];
    $scope.gridDefs = [];
    $scope.gridOptions = {
        data: 'gridData',
        columnDefs: 'gridDefs',
        enableCellSelection: true,
        enableRowSelection: false,
        enableCellEditOnFocus: true
    }

    $scope.$on('ngGridEventEndCellEdit', function(evt){
        var item = evt.targetScope.row.entity;
        item.$update({id: item['id']});
    });
});

app.run(["$templateCache", "$interpolate", function($templateCache, $interpolate) {
    var getFn = $templateCache.get;
    $templateCache.get = function(key){
    return getFn(key).replace(/{{/g, $interpolate.startSymbol)
                     .replace(/}}/g, $interpolate.endSymbol);
  }
}]);