'use strict';

/**
 * RequireJS Module for angular services, providers, factories, decorators, values and constants
 * @param  {[type]} global
 * @param  {[type]} angular
 * @param  {[type]} moment
 * @return {[type]}
 * @private
 */
define(['globals', 'angular', 'moment'],
    function(globals, angular, moment) {

        /**
         * @ngdoc module
         * @name smartInvestor.services
         * @requires bizregistrator.configs
         * @description Service module
         */
        angular.module(globals.appName + '.services', []).
        
        /**
         * @ngdoc value
         * @name smartInvestor.services.value:version
         * @description version of the app
         */
        value('version', '0.0.2').
                
        /**
         * @ngdoc provider
         * @name smartInvestor.services.provider:Utils
         * @param  {object} $window
         * @return {[type]}
         */
        factory('Utils', ['$window',
            function($window) {
                var baseUrl = $window.location.origin + '/assets/';
                return {
                    baseUrl: baseUrl
                };
            }
        ]).
        
        /**
         * @ngdoc provider
         * @name smartInvestor.services.provider:Data
         * @description  Common Data service that represents services not directly linked with
         * server models but used across controllers
         * @param  {Object} api
         * @return {Object}
         */
        factory('Data', ['api',
            function(api) {
                var model = {
                    search: {
                        price: 300000,
                        rooms: 3,
                        area: 100
                    }
                };
                return model;
            }
        ]).
        
        /**
         * @ngdoc provider
         * @name smartInvestor.services.provider:api
         * @description API
         * @return {[type]}
         */
        factory('api', ['$http', '$window',
            function($http, $window) {
                
                var lat, lng, timestamp, sideLength, limit;

                var api = {
                    searchProfiles: {
                        get: function(lat, lng) {
                            return $http({
                                method: 'GET',
                                // url: '/api/predictions',
                                url: $window.location.origin + '/dummy_data/listSearches.json',
                                // url: '/yin-api/services/growth/historical',
                                params: {
                                    lat: lat,
                                    lng: lng
                                }
                            });
                        }
                    }
                };
                return api;
            }
        ]);

    });
