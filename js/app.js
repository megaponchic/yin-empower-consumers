'use strict';

/**
 * Global require js configuration. Adds files to be loaded within the application
 * and their dependancies
 * @private
 * @type {Object}
 */
requirejs.config({
    paths: {
        'async': '../components/requirejs-plugins/async',
        'infobox': '../components/gmaps-utility-library/infobox',
        'jquery': 'http://code.jquery.com/jquery-2.1.1.min',
        'bootstrap': 'http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min',
        'angular': 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.0-rc.1/angular.min',
        'angular-animate': 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.0-rc.1/angular-animate.min',
        'angular-sanitize': 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.0-rc.1/angular-sanitize.min',
        'moment': 'http://cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.3/moment.min',
        'typeaheadjs': '../components/typeaheadjs/typeahead.bundle',
        'nouislider': '../components/jquery.nouislider/jquery.nouislider.min'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        },
        'angular': {
            deps: ['jquery'],
            exports : 'angular'
        },
        'angular-animate': {
            deps: ['angular'],
            exports : 'angular'
        },
        'angular-sanitize': {
            deps: ['angular'],
            exports : 'angular'
        },
        'infobox': {
            deps: ['async', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyCBZEaZXYeqrpAOom_ww7fSHJX0VJ8pj0c&sensor=true&region=GE&libraries=places,geometry&language=EN']
        },
        'typeaheadjs': {
            deps: ['jquery']
        },
        'nouislider': {
            deps: ['jquery']
        }
    }
});

/**
 * Initial require call to bootstrap an application
 * @private
 * @param  {object} globals      [description]
 * @param  {object} $            [description]
 * @param  {object} moment       [description]
 * @param  {object} bootstrap    [description]
 * @param  {object} angular      [description]
 * @param  {object} controllers
 * @return {[type]}              [description]
 */
require(['globals', 
        'jquery', 
        'moment', 
        'bootstrap', 
        'angular', 
        './controllers', 
        './directives', 
        './filters', 
        './services', 
        'angular-animate', 
        'angular-sanitize',
        'infobox',
        'nouislider'],
    function(globals, 
            $, 
            moment, 
            bootstrap, 
            angular, 
            controllers) {

        // Declare app level module
        angular.module(globals.appName, [globals.appName + '.filters', globals.appName + '.services', globals.appName + '.directives', 'ngAnimate', 'ngSanitize']);
        angular.module(globals.appName).controller("BaseController", controllers.BaseController);

        // Bootstrap app
        angular.bootstrap(document, [globals.appName]);

});
