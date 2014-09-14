'use strict';

/**
 * RequireJS module for angular directives.
 * Directives are for reusable html parts with logic
 * @param  {object} globals
 * @param  {object} angular
 * @param  {object} moment
 * @private
 */
define(['globals', 'angular', 'moment', './services', 'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyCBZEaZXYeqrpAOom_ww7fSHJX0VJ8pj0c&sensor=true&region=GE&libraries=places,geometry&language=EN', 'infobox', 'typeaheadjs', 'nouislider'],
    function(globals, angular, moment) {

        /**
         * @ngdoc module
         * @name bizregistrator.directives
         * @requires bizregistrator.configs, ui.router
         */
        angular.module(globals.appName + '.directives', []).
            /**
            * TODO: add description
            */
            directive('sbSearchInput', [ "$window", "$location", "Data", function($window, $location, Data ) {
                return {
                    restrict: 'EA',
                    require: 'ngModel',
                    //replace: true,
                    scope: {
                        model: '=ngModel'
                    },
                    link: function(scope, elm, attrs, ngModelCtrl) {
                        scope.Data = Data;
                        scope.Data.sbSearchInput = {};
                        scope.Data.sbSearchInput.BloodhoundFactory = {};

                        scope.autocomplete = new google.maps.places.AutocompleteService();
                        
                        // typeahead autocomplete
                        elm.typeahead({
                                highlight: true,
                                autoselect: true
                            },
                            {
                                name: 'query',
                                displayKey: 'description',
                                source: function(query, cb) {
                                    if (scope.autocomplete) {
                                        scope.autocomplete.getPlacePredictions({ 
                                            input: query, 
                                            componentRestrictions : {country: 'de'},
                                            types: ['geocode']
                                        }, function(predictions, status) {
                                          if (status != google.maps.places.PlacesServiceStatus.OK) {
                                            console.log(status);
                                            return;
                                          }
                                          cb(predictions);
                                        });
                                    }
                                },
                                templates: {
                                    suggestion: function(suggestionObj) {
                                        var element = [
                                            '<p class="repo-name">' + suggestionObj.description + '</p>'
                                        ].join('\n');
                                        return element;
                                    },
                                    header: '<h5 class="autocomplete-header">' + '<img class="pull-right" src="' + $location.protocol() + "://" + $location.host()+ ":" + $location.port() + '/img/pbg.png"></></h5>'
                                }
                            });

                        scope._onAutoCompletion = function($e, data, data_set) {
                            if (!$.isEmptyObject(data)){
                                scope.Data.search.query = data.description;
                                scope.Data.search.location = data;
                                var address = "";
                                var geocoder = new google.maps.Geocoder();
                                geocoder.geocode({ address: scope.Data.search.query }, function(results, status) {
                                    if (status == google.maps.GeocoderStatus.OK) {
                                        var latlng = results[0].geometry.location;
                                        scope.Data.search.latlng = latlng;
                                        if (!scope.Data.search.date) {
                                            scope.Data.search.date = moment();
                                        }
                                        // $state.go('home.search', {latlng:'@' + latlng.lat() + "," + latlng.lng(), timestamp: scope.Data.search.date.valueOf()});
                                    } else {
                                        alert('Geocode was not successful for the following reason: ' + status);
                                    }
                                });
                                scope.$apply();
                            }
                        }

                        // elm.keyup(function (e) {
                        //     scope._onAutoCompletion(e, {}, "");
                        // });
                        // when selected item or autocompleted
                        elm.on('typeahead:autocompleted', scope._onAutoCompletion);
                        elm.on('typeahead:selected', scope._onAutoCompletion);

                        // // fixing typeahead width
                        // // angular.element('.twitter-typeahead .tt-hint').addClass('col-md-12');

                        // angular.element('.tt-example').click(function(e) {
                        //     e.preventDefault();
                        //     elm.typeahead('val', angular.element(this).text());
                        // });

                    }
                }
            }]).
            /**
             * TODO: add description
             * @private
             */
            directive('sbMap', [ "Data", "$http", "$window", "$compile", "$q", "$timeout", "$location", "api", 
                function(Data, $http, $window, $compile, $q, $timeout, $location, api) {
                return {
                    restrict: 'EA',
                    require: 'ngModel',
                    //replace: true,
                    scope: {
                        model: '=ngModel',
                        form: '=',
                        mapIconG: '@',
                        mapIconB: '@',
                        gmapsUrl: '@',
                        listenResize: "@",
                        resizeMinHeight: "@",
                        resizeBottomOffset: "@"              
                    },
                    link: function(scope, elm, attrs, ngModel) {
                        scope.Data = Data;
                        scope.markers = [];
                        scope.Data.sbMap = {}; // initialization of directive specific data that is shared across app
                        scope.Data.sbMap.initialized = true;
                        scope.Data.sbMap.loaded = false;
                    
                        scope.coords = {};

                        if (!scope.Data.search.query) {
                            scope.coords.lat = "52.5075419";
                            scope.coords.lng = "13.4261419";
                            scope.coords.city = "Berlin, Germany";
                            scope.Data.search.query = scope.coords.city;
                            scope.Data.search.type = "query";
                            scope.Data.search.latlng = new google.maps.LatLng(Number(scope.coords.lat), Number(scope.coords.lng));
                        }
                        scope.Data.sbMap.map = new google.maps.Map(elm.get(0), {
                          center: scope.Data.search.latlng,
                          scrollwheel: false
                        });
                        if (scope.coords.city) {
                            scope.Data.sbMap.map.setZoom(13);
                        } else {
                            scope.Data.sbMap.map.setZoom(13);
                        }

                        // global loading elem for infowindow
                        scope.loadingElem = $compile('<div>Loading...</div>')(scope)[0];
                        
                        var myOptions = {
                             // content: boxText,
                            boxClass: "sb-infobox",
                            disableAutoPan: false,
                            maxWidth: 0,
                            pixelOffset: new google.maps.Size(-130, -30),
                            alignBottom: true,
                            closeBoxMargin: "0px",
                            closeBoxURL: "",
                            infoBoxClearance: new google.maps.Size(10, 110),
                            pane: "floatPane",
                            enableEventPropagation: false,
                            visible: true
                        };

                        scope.infobox = new InfoBox(myOptions);

                        // scope.Data.sbMap.map.data.loadGeoJson($window.location.origin + '/dummy_data/google.json');

                        google.maps.event.addListenerOnce(scope.Data.sbMap.map, 'tilesloaded', function(){
                            scope.Data.sbMap.loaded = true;
                            scope.clearMarkers(scope.markers);
                            scope.getBusinessMarkers(scope.coords.lat, scope.coords.lng, scope.Data.search.price, scope.Data.search.rooms, scope.Data.search.area, scope.Data.search.propertyType);
                            scope.$apply();
                        });                

                        // if we move or zoom map then reget markers
                        google.maps.event.addListener(scope.Data.sbMap.map, 'dragend', function() {
                            scope.clearMarkers(scope.markers);
                            scope.getBusinessMarkers(scope.Data.sbMap.map.getCenter().lat(), scope.Data.sbMap.map.getCenter().lng(), scope.Data.search.price, scope.Data.search.rooms, scope.Data.search.area, scope.Data.search.propertyType);
                        });
                        google.maps.event.addListener(scope.Data.sbMap.map, 'zoom_changed', function() {
                            scope.clearMarkers(scope.markers);
                            scope.getBusinessMarkers(scope.Data.sbMap.map.getCenter().lat(), scope.Data.sbMap.map.getCenter().lng(), scope.Data.search.price, scope.Data.search.rooms, scope.Data.search.area, scope.Data.search.propertyType);
                        });

                        scope.clearMarkers = function(markersArray) {
                          for (var i = 0; i < markersArray.length; i++ ) {
                            if (markersArray[i].canvas) {
                                angular.noop();
                            }
                            markersArray[i].setMap(null);
                          }
                          markersArray.length = 0;
                        }

                        // gets markers within a given radius and shows them
                        scope.getBusinessMarkers = function(lat, lng, price, rooms, area, propertyType) {
                            api.searchProfiles.get(lat, lng, price, rooms, area, propertyType).then(function(results) {
                                if (results.data.length > 0) {
                                    results.data.sort(function(a,b) {
                                        if (a.radius < b.radius) {
                                            return -1;
                                        }
                                        if (a.radius > b.radius) {
                                            return 1;
                                        }
                                        return 0;
                                    });

                                    // var 
                                    angular.forEach(results.data, function(val, i) {
                                        if (val.latitude && val.longitude && val.radius) {
                                            var marker = new google.maps.Marker({
                                                position: new google.maps.LatLng(val.latitude, val.longitude),
                                                map: scope.Data.sbMap.map,
                                                icon: {
                                                    path: google.maps.SymbolPath.CIRCLE,
                                                    fillColor: '#0000ff',
                                                    fillOpacity: 0.5,
                                                    scale: val.radius*1/scope.Data.scale[scope.Data.sbMap.map.getZoom().toString()]*1000000,
                                                    // strokeColor: 'gold',
                                                    strokeWeight: 0
                                                },
                                                // title: 'Hello World!'
                                                // icon : {
                                                //   size : val.BA ? new google.maps.Size(48, 48) : new google.maps.Size(18, 18),
                                                //   url : val.BA ? $location.protocol() + "://" + $location.host()+ ":" + $location.port() + "/assets/" + scope.Data.sbMap.mapIconB : $location.protocol() + "://" + $location.host()+ ":" + $location.port() + "/assets/" + scope.Data.sbMap.mapIconG,
                                                //   zIndex: zIndex
                                                // }
                                                animation: google.maps.Animation.DROP
                                            });
                                            scope.markers.push(marker);

                                            google.maps.event.addListener(marker, 'click', function() {
                                                scope.activeMarker = marker;
                                                // show loading before content loaded
                                                // scope.infobox.setContent(scope.loadingElem);
                                                scope.infobox.open(scope.Data.sbMap.map, marker);
                                                scope.infobox.setVisible(true);
                                                scope.infobox.setContent(scope.showBusinessMarker(val));
                                            });
                                        }
                                    });
                                }
                            });

                        }

                        // Load Business info for the marker and generate html
                        scope.showBusinessMarker = function(business) {
                            var elem = '<div><div class="sb-closebox" ng-click="closeInfoBox(infobox)"><i class="fa fa-times"></i></div><div class="sb-infobox-content">';
                            elem += '<h5>' + business.groupName + '</h5><p class="info-box-desc">' 
                                        + business.description + '</p>'
                            return $compile(elem)(scope)[0];
                        }

                        // sets height to visual area
                        if (scope.listenResize !== "false") {
                            scope.resizeFn = function() {
                                elm.height(angular.element($window).height() - 91);
                            }
                            scope.resizeFn();
                            angular.element($window).resize(scope.resizeFn);                
                        }

                        scope.closeInfoBox = function(infobox) {
                            infobox.setVisible(false);
                        }

                        scope.goToBusiness = function(business, e) {
                            scope.Data.search.query = business.name;
                            scope.Data.search.id = business.id;
                            scope.Data.search.type = "business";

                            var timestamp = moment(scope.Data.search.date).valueOf() || moment().add('days',1).hours(10).minutes(0).seconds(0).milliseconds(0).valueOf();
                            // $state.go('home.search.apartment', {slug: business.slug, timestamp: timestamp, serviceId: scope.Data.search.serviceId});
                            // scope.Data.sbMap.map.setCenter(scope.activeMarker.getPosition());
                        }

                        scope.$watch('Data.search.latlng', function (newVal, oldVal, scope) {
                            if (newVal !== oldVal && !$.isEmptyObject(newVal)) {
                                scope.Data.sbMap.map.setCenter(scope.Data.search.latlng);
                                scope.Data.sbMap.map.setZoom(13);
                            }
                        }, true);

                    }
                }
            }]).
            /**
             * [description]
             * @param  {[type]} $timeout
             * @param  {[type]} Notification
             * @return {[type]}
             */
            directive('sbNoUiSlider', [ "$timeout", "$location", function ($timeout, $location) {
                return {
                    restrict: 'A',
                    // require: 'ngModel',
                    scope: {
                        options: '=',
                        set: '=',
                        slide: '=sbNusSlide',
                        nusEl: '='
                    },
                    link: function (scope, element, attr) {
                        element.noUiSlider(scope.options);
                        // scope.nusEl = element.noUiSlider;
                        // element.Link('upper').to('-inline-<div class="sb-nus-tooltip"></div>', function ( value ) {
                        //     $(this).html(
                        //         '<span>' + value + '</span>'
                        //     );
                        // });
                        element.on({
                            set: scope.set,
                            slide: scope.slide
                        });
                    }
                }
            }]).
            directive('leftBlock', ['$window', function($window) {
                return {
                    restrict: 'A',
                    link: function (scope, elm, attr) {
                        scope.resizeFn = function() {
                            elm.height(angular.element($window).height() - 91);
                        }
                        scope.resizeFn();
                        angular.element($window).resize(scope.resizeFn);
                    }
                }
            }]);
    });
