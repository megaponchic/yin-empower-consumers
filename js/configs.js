'use strict';

/**
 * Module that defines initial configuration of the app
 * @param  {object} globals
 * @param  {object} angular
 * @param  {object} controllers
 * @private
 */
define(['globals', 'angular', './controllers'], function(global, angular, controllers) {

    /**
     * @ngdoc module
     * @name smartInvestor.configs
     * @requires ui.router
     * @description Module that contains configurations of the app
     */
    angular.module(global.appName + '.configs');

});
