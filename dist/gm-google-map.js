/*! gm-google-map - v0.0.12 - 2017-07-01
* https://github.com/srizzo/gm-google-map
* Copyright (c) 2017 Samuel Rizzo; Licensed MIT */
angular.module('gm-google-map', [])
/**
 * @description
 *
 * Shared map context. Publishes $scope.$setMap(map) and $scope.$getMap().
 *
 */
.directive('gmMapContext', function() {
  return {
    scope: true,
    restrict: 'EA',
    controller: ["$scope", function ($scope) {
      var _map;
      $scope.$setMap = function (map) {
        _map = map
      }
      $scope.$getMap = function () {
        return _map
      }
    }]
  }
})

/**
 * @description
 *
 * Map Canvas. Publishes $scope.$setMap(map) and $scope.$getMap().
 *
 */
.directive('gmMapCanvas', function() {
  return {
    scope: true,
    restrict: 'EA',
    require: '^?gmMapContext',
    link: {
      pre: function (scope, element, attrs) {

        var disableDefaultUI = false
        
        if (attrs.disableDefaultUi)
          disableDefaultUI = scope.$eval(attrs.disableDefaultUi)

        var _map = new google.maps.Map(element[0], {
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: disableDefaultUI,
          styles: [
            {
              featureType: 'poi',
              elementType: 'all',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })
        
        if (!scope.$setMap) {
          scope.$setMap = function (map) {
            _map = map
          }
          scope.$getMap = function () {
            return _map
          }
        }
        
        scope.$setMap(_map)

        if (attrs.zoom) {
          scope.$watch(attrs.zoom, function(current) {
            _map.setZoom(current)
          })
        }

        if (attrs.center) {
          scope.$watch(attrs.center, function(current) {
            if (current == null) {
              return
            }
            _map.setCenter(new google.maps.LatLng(current.lat, current.lng))
          }, true)
        }

        scope.safeApply = function(fn) {
          var phase = scope.$root.$$phase
          if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
              fn()
            }
          } else {
            scope.$apply(fn)
          }
        }

        angular.forEach(scope.$eval(attrs.listeners), function (listener, key) {
          google.maps.event.addListener(_map, key, function () {
            scope.safeApply(function () {
              listener()
            })
          })
        })

        angular.forEach(scope.$eval(attrs.listenersOnce), function (listener, key) {
          google.maps.event.addListenerOnce(_map, key, function () {
            scope.safeApply(function () {
              listener()
            })
          })
        })
      
      }
    }
  }
})

/**
 * @description
 *
 * The sole purpose of the gmAddOns directive is to group gm-* directives / dom elements into a hidden element, preventing them from being displayed outside the map canvas
 *
 */
.directive('gmAddOns', function() {
  return {
    scope: true,
    restrict: 'EA',
    compile: function (element) {
      element.css("display", "none")
    }
  }
})
.directive('gmControl', function() {
  return {
    scope: true,
    compile: function(element, attrs) {

      if (typeof attrs.visible === 'undefined')
        attrs.visible = "true"

      return {
        pre: function(scope, element, attrs) {

          var domElement = element[0]

          var map = scope.$getMap()

          var position = attrs.position || "LEFT_TOP"

          scope.$hide = function() {
            var index = map.controls[google.maps.ControlPosition[position]].indexOf(domElement)
            if (index > -1)
              map.controls[google.maps.ControlPosition[position]].removeAt(index)
          }

          scope.$show = function() {
            
          var index = map.controls[google.maps.ControlPosition[position]].indexOf(domElement)
          if (index < 0)
            map.controls[google.maps.ControlPosition[position]].push(domElement)
          }

          if (attrs.visible) {
            scope.$watch(attrs.visible, function(current) {
              if (current === true)
                scope.$show()
              else
                scope.$hide()
            })
          }

        }
      }
    }
  }
})

/**
 * @description
 *
 * InfoWindow. Expects $scope.$getMap() and $scope.$getMarker() to be available. Publishes $scope.$openInfoWindow() and $scope.$closeInfoWindow().
 *
 */
.directive('gmInfoWindow', function() {
  return {
    scope: true,
    compile: function() {
      return {
        pre: function(scope, element, attrs) {
          var domElement = element[0]

          var infoWindow = new google.maps.InfoWindow()
          infoWindow.setContent(domElement)

          if (attrs.closeclick) {
            infoWindow.addListener('closeclick', function() {
              scope.$apply(function() {
                scope.$eval(attrs.closeclick)
              })
            })
          }

          scope.$openInfoWindow = function() {
            infoWindow.open(scope.$getMap(), scope.$getMarker())
          }

          scope.$closeInfoWindow = function() {
            infoWindow.close()
          }
        }
      }
    }
  }
})
/**
 * @description
 *
 * Overlapping Marker Spiderfier. Expects $scope.$getMap() to be available. Publishes $scope.$getOverlappingMarkerSpiderfier(). Triggers gm_oms_click google maps event when a marker is clicked.
 *
 * Requires https://cdn.rawgit.com/srizzo/OverlappingMarkerSpiderfier/0.3.3/dist/oms.min.js
 *
 */
.directive('gmOverlappingMarkerSpiderfier', function() {
  return {
    restrict: 'AE',
    scope: true,
    compile: function () {
      return {
        pre: function(scope, element) {

          element.css("display", "none")

          var oms = new OverlappingMarkerSpiderfier(scope.$getMap(), {
            keepSpiderfied: true
          })
      
          scope.$getOverlappingMarkerSpiderfier = function () {
            return oms
          }

          scope.$on("gm_marker_created", function (event, marker) {
            oms.addMarker(marker)
          })

          scope.$on("gm_marker_destroyed", function (event, marker) {
            oms.removeMarker(marker)
          })

          oms.addListener('click', function(marker, event) {
            scope.$apply(function() {
              google.maps.event.trigger(marker, "gm_oms_click", event)
            })
          })

        }
      }
    }
  }
})

/**
 * @description
 *
 * Marker. Expects $scope.$getMap() to be available.  Publishes $scope.$getMarker(). Emits gm_marker_created and gm_marker_destroyed angularjs events.
 *
 */
.directive('gmMarker', function() {
  return {
    restrict: 'AE',
    scope: true,
    compile: function() {
      return {
        pre: function(scope, element, attrs) {

          var marker = new google.maps.Marker({
            map: scope.$getMap(),
            data: scope.$eval(attrs.data),
            title: scope.$eval(attrs.title),
            optimized: scope.$eval(attrs.optimized),
            position: new google.maps.LatLng(scope.$eval(attrs.position).lat, scope.$eval(attrs.position).lng)
            
          })

          scope.$getMarker = function () {
            return marker
          }
          
          if (attrs.position) {
            var unbindPositionWatch = scope.$watch(attrs.position, function(current) {
              marker.setPosition(new google.maps.LatLng(current.lat, current.lng))
            })
          }
          
          if (attrs.icon) {
            var unbindIconWatch = scope.$watch(attrs.icon, function(current) {
              marker.setIcon(current)
            })
          }

          scope.$emit("gm_marker_created", marker)

          scope.$on("$destroy", function() {
            unbindPositionWatch()
            unbindIconWatch()
            marker.setMap(null)
            scope.$emit("gm_marker_destroyed", marker)
          })
          
          scope.safeApply = function(fn) {
            var phase = scope.$root.$$phase
            if(phase == '$apply' || phase == '$digest') {
              if(fn && (typeof(fn) === 'function')) {
                fn()
              }
            } else {
              scope.$apply(fn)
            }
          }
          
          angular.forEach(scope.$eval(attrs.listeners), function (listener, key) {
            google.maps.event.addListener(marker, key, function () {
              scope.safeApply(function () {
                listener()
              })
            })
          })

          angular.forEach(scope.$eval(attrs.listenersOnce), function (listener, key) {
            google.maps.event.addListenerOnce(marker, key, function () {
              scope.safeApply(function () {
                listener()
              })
            })
          })          
        }
      }
    }
  }
})

/**
 * @description
 *
 * Polyline. Expects $scope.$getMap() to be available.  Publishes $scope.$getPolyline(). Emits gm_polyline_created and gm_polyline_destroyed angularjs events.
 *
 */
.directive('gmPolyline', function() {
  return {
    restrict: 'AE',
    scope: true,
    compile: function() {
      return {
        pre: function(scope, element, attrs) {

          var polyline = new google.maps.Polyline({
            map: scope.$getMap(),
            data: scope.$eval(attrs.data),
            path: scope.$eval(attrs.path),
            geodesic: scope.$eval(attrs.geodesic),
            strokeColor: scope.$eval(attrs.strokeColor),
            strokeOpacity: scope.$eval(attrs.strokeOpacity),
            strokeWeight: scope.$eval(attrs.strokeWeight)
          })

          scope.$getPolyline = function () {
            return polyline
          }

          if (attrs.icon) {
            var unbindIconWatch = scope.$watch(attrs.icon, function(current) {
              polyline.setIcon(current)
            })
          }

          scope.$emit("gm_polyline_created", polyline)

          scope.$on("$destroy", function() {
            unbindIconWatch()
            polyline.setMap(null)
            scope.$emit("gm_polyline_destroyed", polyline)
          })
          
          scope.safeApply = function(fn) {
            var phase = scope.$root.$$phase
            if(phase == '$apply' || phase == '$digest') {
              if(fn && (typeof(fn) === 'function')) {
                fn()
              }
            } else {
              scope.$apply(fn)
            }
          }
          
          angular.forEach(scope.$eval(attrs.listeners), function (listener, key) {
            google.maps.event.addListener(polyline, key, function () {
              scope.safeApply(function () {
                listener()
              })
            })
          })

          angular.forEach(scope.$eval(attrs.listenersOnce), function (listener, key) {
            google.maps.event.addListenerOnce(polyline, key, function () {
              scope.safeApply(function () {
                listener()
              })
            })
          })          
        }
      }
    }
  }
})

/**
 * @description
 *
 * Adds listeners to google maps objects.
 *
 */
.directive('gmAddListeners', function() {
  return {
    scope: true,
    restrict: 'EA',
    link: {
      pre: function (scope, element, attrs) {

        scope.safeApply = function(fn) {
          var phase = scope.$root.$$phase
          if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
              fn()
            }
          } else {
            scope.$apply(fn)
          }
        }
        
        var to = scope.$eval(attrs.to)
        
        angular.forEach(scope.$eval(attrs.listeners), function (callback, key) {
          google.maps.event.addListener(to, key, function () {
            scope.safeApply(function () {
              scope.$eval(callback)
            })
          })
        })

        angular.forEach(scope.$eval(attrs.listenersOnce), function (callback, key) {
          google.maps.event.addListenerOnce(to, key, function () {
            scope.safeApply(function () {
              scope.$eval(callback)
            })
          })
        })
      
      }
    }
  }
})
