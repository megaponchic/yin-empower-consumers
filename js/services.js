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
                        area: 100,
                        propertyType: 'APPARTMENT'
                    },
                    scale: {
                        20 : 1128.497220,
                        19 : 2256.994440,
                        18 : 4513.988880,
                        17 : 9027.977761,
                        16 : 18055.955520,
                        15 : 36111.911040,
                        14 : 72223.822090,
                        13 : 144447.644200,
                        12 : 288895.288400,
                        11 : 577790.576700,
                        10 : 1155581.153000,
                        9  : 2311162.307000,
                        8  : 4622324.614000,
                        7  : 9244649.227000,
                        6  : 18489298.450000,
                        5  : 36978596.910000,
                        4  : 73957193.820000,
                        3  : 147914387.600000,
                        2  : 295828775.300000,
                        1  : 591657550.500000
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
                        get: function(lat, lng, price, rooms, area, propertyType) {
                            return $http({
                                method: 'GET',
                                // url: '/api/predictions',
                                url: $window.location.origin + '/dummy_data/listSearches.json',
                                // url: '/yin-api/services/growth/historical',
                                params: {
                                    lat: lat,
                                    lng: lng,
                                    price: price,
                                    rooms: rooms,
                                    area: area,
                                    propertyType: propertyType
                                }
                            });
                        }
                    }
                };
                return api;
            }
        ]);

    });
