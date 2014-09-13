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
                            // scope.clearMarkers(scope.markers);
                            // scope.getBusinessMarkers(scope.coords.lat, scope.coords.lng, 
                            //     scope.Data.sbMap.map.getBounds().getSouthWest().lat(), scope.Data.sbMap.map.getBounds().getSouthWest().lng(), 
                            //     scope.Data.sbMap.map.getBounds().getNorthEast().lat(), scope.Data.sbMap.map.getBounds().getNorthEast().lng(), scope.Data.sbMap.map.getZoom());
                            scope.$apply();
                        });                

                        // if we move or zoom map then reget markers
                        google.maps.event.addListener(scope.Data.sbMap.map, 'dragend', function() {
                            scope.clearMarkers(scope.markers);
                            // scope.getBusinessMarkers(scope.Data.sbMap.map.getCenter().lat(), scope.Data.sbMap.map.getCenter().lng(), 
                            //     scope.Data.sbMap.map.getBounds().getSouthWest().lat(), scope.Data.sbMap.map.getBounds().getSouthWest().lng(), 
                            //     scope.Data.sbMap.map.getBounds().getNorthEast().lat(), scope.Data.sbMap.map.getBounds().getNorthEast().lng(), scope.Data.sbMap.map.getZoom());
                        });
                        google.maps.event.addListener(scope.Data.sbMap.map, 'zoom_changed', function() {
                            scope.clearMarkers(scope.markers);
                            // scope.getBusinessMarkers(scope.Data.sbMap.map.getCenter().lat(), scope.Data.sbMap.map.getCenter().lng(), 
                            //     scope.Data.sbMap.map.getBounds().getSouthWest().lat(), scope.Data.sbMap.map.getBounds().getSouthWest().lng(), 
                            //     scope.Data.sbMap.map.getBounds().getNorthEast().lat(), scope.Data.sbMap.map.getBounds().getNorthEast().lng(), scope.Data.sbMap.map.getZoom());
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
                        scope.getBusinessMarkers = function(lat, lng, swLat, swLng, neLat, neLng, zoom) {
                            var getSizesByCityOnly;
                            if (zoom < 10) {
                                getSizesByCityOnly = true;    
                            } else {
                                getSizesByCityOnly = false;
                            }
                            api.Business.getLatLngOfBusinesses(lat, lng, swLat, swLng, neLat, neLng, getSizesByCityOnly).
                            success(function(data, status){
                                if (data.length > 0 && data[0].count) {
                                    scope.businessesCount = data;
                                    angular.forEach(scope.businessesCount, function(val, i){
                                        var canvasWidth, canvasOpacity, zIndex;
                                        if (val.lat && val.lng) {
                                            if (val.count > 0 && val.count < 10) {
                                                canvasWidth = 20;
                                                canvasOpacity = 0.8
                                                zIndex = 10;
                                            } else if (val.count >= 10 && val.count < 50) {
                                                canvasWidth = 40;
                                                canvasOpacity = 0.9
                                                zIndex = 20;
                                            } else if (val.count >= 50) {
                                                canvasWidth = 60;
                                                canvasOpacity = 0.9
                                                zIndex = 30;
                                            }
                                            var canvas = document.createElement("canvas");
                                            var tCtx = canvas.getContext('2d');
                                            tCtx.canvas.width = canvasWidth;// tCtx.measureText(val.count.toString()).width;
                                            tCtx.fillStyle = "#6aceeb";
                                            tCtx.globalAlpha = 0.9;
                                            tCtx.beginPath();
                                            var radius = canvasWidth/2; // for example
                                            tCtx.arc(canvasWidth/2, canvasWidth/2, radius, 0, Math.PI * 2);
                                            tCtx.closePath();
                                            tCtx.fill();
                                            tCtx.fillStyle = "white"; // font color to write the text with
                                            // Move it down by half the text height and left by half the text width
                                            var width = tCtx.measureText(val.count.toString()).width;
                                            var height = tCtx.measureText("w").width; // this is a GUESS of height
                                            tCtx.fillText(val.count.toString(), canvasWidth/2 - (width/2) ,canvasWidth/2 + (height/2));
                                            // tCtx.fillText(val.count.toString(), 0, 10);                                
                                            var marker = new google.maps.Marker({
                                                position: new google.maps.LatLng(val.lat,val.lng),
                                                map: scope.Data.sbMap.map,
                                                zIndex: zIndex,
                                                // title: 'Hello World!'
                                                icon : {
                                                  size : new google.maps.Size(canvasWidth, canvasWidth),
                                                  url : tCtx.canvas.toDataURL(),
                                                  anchor: new google.maps.Point(canvasWidth/2, canvasWidth/2)
                                                }
                                                // animation: google.maps.Animation.DROP
                                            });
                                            marker.canvas = canvas;
                                            scope.markers.push(marker);
                                            google.maps.event.addListener(marker, 'click', function() {
                                                // scope.Data.sbMap.map.setZoom(scope.Data.sbMap.map.getZoom() + 1);
                                                scope.Data.sbMap.map.setZoom(11);
                                                scope.Data.sbMap.map.setCenter(new google.maps.LatLng(val.lat,val.lng));
                                            });
                                        }
                                    });                        
                                } else if (data.length > 0) {
                                    scope.businesses = data;
                                    angular.forEach(scope.businesses, function(val, i){
                                        if (val.BA) {
                                            var zIndex = 20;
                                        } else {
                                            var zIndex = 10;
                                        }
                                        if (val.lat && val.lng) {
                                            var marker = new google.maps.Marker({
                                                position: new google.maps.LatLng(val.lat,val.lng),
                                                map: scope.Data.sbMap.map
                                                // icon: {
                                                //     path: 'M-293.039-548.582c-3.294,0-5.962-2.669-5.962-5.962v-2.003c0-7.554-6.146-14.699-13.699-14.699h-17.206c-7.554,0-13.699,6.146-13.699,13.699v12.003c0,7.69-11.924,7.689-11.924,0v-12.003c0-14.129,11.495-25.623,25.623-25.623h17.206c14.128,0,25.623,12.494,25.623,26.623v2.003C-287.077-551.251-289.747-548.582-293.039-548.582z M52.768,0c-25.62,0-42.595,28.32-30.231,50.928c0.082,0.372,26.947,47.043,26.947,47.043c0.677,1.17,1.929,1.896,3.285,1.896c1.354-0.002,2.604-0.726,3.282-1.896c0,0,26.863-46.67,26.946-47.041c2.68-4.898,4.203-10.519,4.203-16.496C87.2,15.417,71.784,0,52.768,0z M52.768,52.775c-13.002,0-20.227-15.814-11.683-25.635c9.195-10.569,27.161-3.854,27.161,10.155C68.245,45.845,61.314,52.775,52.768,52.775z M-669.54-508.264v-20.134c0-18.213,14.765-32.978,32.978-32.978h28.859c18.213,0,32.978,14.765,32.978,32.978v20.134',
                                                //     fillColor: 'yellow',
                                                //     fillOpacity: 0.8,
                                                //     scale: 0.1,
                                                //     strokeColor: 'gold',
                                                //     strokeWeight: 14
                                                // }
                                                // title: 'Hello World!'
                                                // icon : {
                                                //   size : val.BA ? new google.maps.Size(48, 48) : new google.maps.Size(18, 18),
                                                //   url : val.BA ? $location.protocol() + "://" + $location.host()+ ":" + $location.port() + "/assets/" + scope.Data.sbMap.mapIconB : $location.protocol() + "://" + $location.host()+ ":" + $location.port() + "/assets/" + scope.Data.sbMap.mapIconG,
                                                //   zIndex: zIndex
                                                // }
                                                // animation: google.maps.Animation.DROP
                                            });
                                            scope.markers.push(marker);

                                            google.maps.event.addListener(marker, 'click', function() {
                                                scope.activeMarker = marker;
                                                // show loading before content loaded
                                                scope.infobox.setContent(scope.loadingElem);
                                                scope.infobox.open(scope.Data.sbMap.map, marker);
                                                scope.infobox.setVisible(true);
                                                scope.showBusinessMarker(val).then(function() {
                                                    scope.infobox.setContent(val.elem);
                                                });
                                            });
                                        }
                                    });                        
                                }
                            }).
                            error(function(data, status) { // TODO: return to previous position
                                scope.error = {};
                                scope.error.message = data || "Request failed";
                                scope.error.status = status;
                            }); 
                        }

                        // Load Business info for the marker and generate html
                        scope.showBusinessMarker = function(business) {
                            return api.Business.getBusinessById(business.id).then(function(data) {
                                scope.Data.sbMap.showPhone = false;
                                scope.business = data;
                                if (!data.description) {
                                    data.description = {};
                                    data.description.text = "";
                                }
                                var address = data.address.line1; 
                                if (data.address.line2 != "" && data.address.line2 != null) {
                                    address += ', ' + data.address.line2;
                                }
                                address += ', ' + data.address.city.name;
                                if (data.address.zip) {
                                    address += ' ' + data.address.zip.code;
                                }
                                address += ', ' + data.address.country.name;
                                if (data.isBookingAllowed) {
                                    var elem = '<div><div class="sb-closebox" ng-click="closeInfoBox(infobox)"><i class="fa fa-times"></i></div><div class="sb-infobox-content">';
                                    elem += '<h5>' + data.name + '&nbsp;<div class="sb-ratings" sb-ratings ng-model="business.ratings"></div><small class="muted show">' + address + '</small></h5><p class="info-box-desc">' 
                                                + data.description.text + '</p>'
                                    if (data.isBookingNeedsConfirmation) {
                                        elem += '<button ng-click="goToBusiness(business, $event)" class="btn btn-sm btn-success col-md-12 btn-block">{{Data.Messages("sb.map.book")}}</button></div></div>';
                                    } else {
                                        elem += '<button ng-click="goToBusiness(business, $event)" class="btn btn-sm btn-success col-md-12 btn-block">{{Data.Messages("sb.map.book")}}</button></div></div>';
                                    }
                                } else {
                                    var elem = '<div><div class="sb-closebox" ng-click="closeInfoBox(infobox)"><i class="fa fa-times"></i></div><div class="sb-infobox-content">';
                                    elem += '<h5>' + data.name + '&nbsp;<div class="sb-ratings" sb-ratings ng-model="business.ratings"><small class="muted show">' + address + '</small></h5><p class="info-box-desc">' 
                                                + data.description.text + '</p><button class="btn btn-default btn-block btn-sm" ng-if="Data.sbMap.showPhone===false" ng-click="Data.sbMap.showPhone=true">' + scope.Data.Messages("sb.map.info_box.show_phone") + '</button><p ng-if="Data.sbMap.showPhone===true">' + scope.Messages("sb.map.info_box.phone") + ' ' + data.address.phone1 + '</p></div></div>';
                                    // elem += '<a ng-href="" ng-click="goToBusiness('
                                    //             + data.id + ', \'' + data.name.replace("'", "\\'") + '\')"><small class="contact-clinic">{{Data.Messages("sb.map.contact_to_book")}}</small></a></div>'
                                }

                                business.elem = $compile(elem)(scope)[0];

                            });
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
