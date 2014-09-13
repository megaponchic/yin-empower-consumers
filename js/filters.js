'use strict';

/**
 * RequireJS module for angular filters.
 * Angular filter transform data using a mapping function
 * @param  {[type]} global
 * @param  {[type]} angular
 * @private
 * @return {[type]}
 */
define(['globals', 'angular'], function(globals, angular) {

    /**
     * @ngdoc module
     * @name bizregistrator.filters
     * @description Filters
     */
    angular.module(globals.appName + '.filters', []).
    /**
     * @ngdoc filter
     * @name bizregistrator.filters.filter:startFrom
     * @description  define from which index start list. We already have a limitTo filter
     * built-in to angular, let's make a startFrom filter
     * @return {function}
     */
    filter('startFrom', function() {
        return function(input, start) {
            if (input) {
                start = +start; //parse to int
                return input.slice(start);
            }
        }
    }).
    /**
     * @ngdoc filter
     * @name bizregistrator.filters.filter:nfCurrency
     * @description Currency filter
     * @param  {[type]} $filter
     * @param  {[type]} $locale
     * @return {function}
     */
    filter('nfcurrency', ['$filter', '$locale',
        function($filter, $locale) {
            var currency = $filter('currency'),
                formats = $locale.NUMBER_FORMATS;
            return function(amount, symbol) {
                var value = currency(amount, symbol);
                return value.replace(new RegExp('\\' + formats.DECIMAL_SEP + '\\d{2}'), '')
            }
        }
    ]).
    /**
     * @ngdoc filter
     * @name bizregistrator.filters.filter:timeFormatting
     * @description [description]
     * @return {[type]}
     */
    filter('timeFormatting', function() { // transforms minutes after 00:00 into 24h time
        return function(value) {
            if (value !== undefined && value !== null) {
                var hours = Math.floor(value / 60);
                if (hours < 10) {
                    hours = "0" + hours.toString();
                } else {
                    hours = hours.toString();
                }
                var minutes = value % 60;
                if (minutes < 10) {
                    minutes = "0" + minutes.toString();
                } else {
                    minutes = minutes.toString();
                }
                return hours + ':' + minutes;
            } else {
                return "0";
            }
        };
    });
});
