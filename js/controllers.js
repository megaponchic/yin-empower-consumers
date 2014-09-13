'use strict';

/**
 * Contorllers module. Defines controllers for Angular app
 * @param  {object} angular AngularJS
 * @param  {object} moment  MomentJS
 * @return {object}         Collection of controllers
 * @private
 */
define(['angular', 'moment', './filters', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyCBZEaZXYeqrpAOom_ww7fSHJX0VJ8pj0c&sensor=true&region=GE&libraries=places,geometry&language=EN'], function(angular, moment) {

    var controllers = {};

    /**
     * @ngdoc object
     * @name smartInvestor.controller:BaseController
     * @description Base controller. Loads with the app.
     * All other controllers inherit scope from it
     * @requires $scope
     * @requires smartInvestor.services.Data
     * @requires smartInvestor.services.api
     */
    controllers.BaseController = ['$scope', '$filter', 'Data', 'api',
        function($scope, $filter, Data, api) {
            $scope.Data = Data;
            $scope.api = api;

            $scope.priceFilter = {
                start: $scope.Data.search.price,
                range: {
                    'min': [ 1000 ],
                    'max': [ 1000000 ]
                },
                step: 1000,
                serialization: {
                    lower: [$.Link({
                        target: '-tooltip-<div class="sb-nus-tooltip"></div>',
                        method: function ( value ) {
                            $(this).html(
                                '<span>' + $filter('nfcurrency')(value, '€ ') + '</span>'
                            );
                        }
                    })]
                }
            };

            $scope.priceFilter.set = function(e, slider) {
                this.Data.search.price = Number(slider);
            }.bind($scope);

            $scope.roomsFilter = {
                start: $scope.Data.search.rooms,
                range: {
                    'min': [ 0 ],
                    'max': [ 10 ]
                },
                step: 1,
                serialization: {
                    lower: [$.Link({
                        target: '-tooltip-<div class="sb-nus-tooltip-sm"></div>',
                        method: function ( value ) {
                            $(this).html(
                                '<span>' + value + '</span>'
                            );
                        }
                    })],
                    format: {
                        decimals: 0,
                        mark: ','
                    }
                }
            };

            $scope.roomsFilter.set = function(e, slider) {
                this.Data.search.rooms = Number(slider);
            }.bind($scope);

            $scope.areaFilter = {
                start: $scope.Data.search.area,
                range: {
                    'min': [ 10 ],
                    'max': [ 1000 ]
                },
                step: 10,
                serialization: {
                    lower: [$.Link({
                        target: '-tooltip-<div class="sb-nus-tooltip-sm"></div>',
                        method: function ( value ) {
                            $(this).html(
                                '<span>' + value + '</span>'
                            );
                        }
                    })],
                    format: {
                        decimals: 0,
                        mark: ','
                    }
                }
            };

            $scope.areaFilter.set = function(e, slider) {
                this.Data.search.area = Number(slider);
            }.bind($scope);

            $scope.searchProfiles = function(search) {
                api.searchProfiles.get(search.latlng.lat(), search.latlng.lng(), search.price, search.rooms, search.area, search.propertyType).then(function(results) {
                    angular.noop();
                });
            }

        }
    ];

    return controllers;

});
