var app = angular.module('app', ['ui.bootstrap', 'ngGrid', 'ngResource'],  
                         function ($interpolateProvider, $httpProvider) {
        $interpolateProvider.startSymbol('{[');
        $interpolateProvider.endSymbol(']}');
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    });

app.controller('ModelsCtrl', function ($scope, $resource) {
    function validateRow(data) {
        var dateRegEx = /^\d{4}-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/,
            schema = $scope.models[$scope.currentModel['id']]['schema'],
            fieldsToCheck = _.reject(_.keys(data), function (el) {
                return el === 'id';
            }),
            dataTypes = _.object(_.map(fieldsToCheck, function (el) {
                return [el, _.findWhere(schema, {id: el})['type']];
            })),
            dataTitles = _.object(_.map(fieldsToCheck, function (el) {
                return [el, _.findWhere(schema, {id: el})['title']];
            })),
            valid = true,
            errors = '';
        
        angular.forEach(data, function (val, key) {
            if (dataTypes[key] === 'int' && !(_.isNumber(val) || val.match(/^\d+$/))) {
                valid = false;
                errors += 'Поле "' + dataTitles[key] + '" должно содержать целое число;\n';
            } else if (dataTypes[key] === 'date' && 
                       !(_.isDate(val) || val.match(dateRegEx))) {
                valid = false;
                errors += 'Поле "' + dataTitles[key] + 
                          '" должно быть датой в формате YYYY-MM-DD;\n';
            }
        });

        if (!valid) {
            alert(errors);
        }
        return valid;
    };

    $scope.models = models;
    $scope.resources = {};
    $scope.newRecord = {};

    $scope.addNewRecord = function () {
        var currentModelId = $scope.currentModel.id;
        if (validateRow($scope.newRecord)) {
            $('#newRecordSubmmitBtn').attr('disabled', 'disabled');
            $scope.resources[$scope.currentModel.id].save($scope.newRecord, function (data) {
                //success case: if model wasn't changed
                if (currentModelId === $scope.currentModel.id) {
                    $scope.gridData.push(data);
                }
                $('#newRecordSubmmitBtn').removeAttr('disabled');
                $('#newRecordForm .form-group').removeClass('has-error');
            });
        } else {
            $('#newRecordForm .form-group').addClass('has-error');
        }
    }

    $scope.getApiUrl = function (modelName) {
        return '/api/' + modelName.toLowerCase() + '/';
    }

    angular.forEach($scope.models, function (value, key) {
       this[key] = $resource($scope.getApiUrl(key) + ':id', null, {update: {method: 'PUT'}});
     }, $scope.resources);

    $scope.$watch('currentModel.id', function (newModel) {
        if (newModel) {
            $scope.gridData = $scope.resources[newModel].query();
            $scope.gridDefs = [{field: 'id', displayName: 'ID', enableCellEdit: false, width: 50}]
            angular.forEach($scope.models[newModel]['schema'], function (el) {
                column = {field: el['id'], displayName: el['title'], enableCellEdit: true};
                if (el['type'] === 'date') {
                    column['editableCellTemplate'] = '<input type="text" ' +
                                                     'datepicker2 ng-model="COL_FIELD" />';
                }
                this.push(column)
             }, $scope.gridDefs);
            $scope.newRecord = {};
        }
    });

    $scope.currentModel = {id: "Users"};

    $scope.gridData = [];
    $scope.gridDefs = [];
    $scope.gridOptions = {
        data: 'gridData',
        columnDefs: 'gridDefs',
        enableCellSelection: false,
        enableRowSelection: false,
        enableCellEditOnFocus: true
    }

    $scope.$on('ngGridEventEndCellEdit', function() {
        var markRow = function (row) {
                row.selected = true;
                $scope.$apply();
            },
            unmarkRow = function (row) {
                row.selected = false;
                $scope.$apply();
            };

        return function (evt) {
            var entity;
            if (evt.targetScope.row) {
                entity = evt.targetScope.row.entity;
                if (validateRow(entity)) {
                    entity.$update({id: entity['id']});
                    unmarkRow(evt.targetScope.row)
                } else {
                    markRow(evt.targetScope.row);
                }
            }
        }
    }());
});

app.directive('datepicker2', function() {
    return {
        link: function(scope, element, attrs) {
            var options = {
                dateFormat: 'yy-mm-dd',
                onClose: function () {
                    scope.$emit('ngGridEventEndCellEdit');
                }
            }
            scope.$on('ngGridEventStartCellEdit', function (evt) {
                date = evt.targetScope.row.entity[evt.targetScope.col.field];
                element.datepicker(options).datepicker('setDate', date).datepicker("show");
            });
        }
    };
});

app.run(["$templateCache", "$interpolate", function($templateCache, $interpolate) {
    var getFn = $templateCache.get;
    $templateCache.get = function(key){
    return getFn(key).replace(/{{/g, $interpolate.startSymbol)
                     .replace(/}}/g, $interpolate.endSymbol);
  }
}]);