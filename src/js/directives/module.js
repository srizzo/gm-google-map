angular.module('gm-google-map', [])
/**
 * @description
 *
 * Shared map context. Publishes $scope.setMap(map) and $scope.getMap().
 *
 */
.directive('gmMapContext', function() {
  return {
    scope: true,
    restrict: 'EA',
    controller: ["$scope", function ($scope) {
      var _map;
      $scope.setMap = function (map) {
        _map = map
      }
      $scope.getMap = function () {
        return _map
      }
    }]
  }
})

/**
 * @description
 *
 * Map Canvas. Publishes the map instance if $scope.setMap(map) is available.
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
        
        if (attrs.gmDisableDefaultUi)
          disableDefaultUI = scope.$eval(attrs.gmDisableDefaultUi)

        var map = new google.maps.Map(element[0], {
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
        
        if (scope.setMap)
          scope.setMap(map)

        if (attrs.gmZoom) {
          scope.$watch(attrs.gmZoom, function(current) {
            map.setZoom(current)
          })
        }

        if (attrs.gmCenter) {
          scope.$watch(attrs.gmCenter, function(current) {
            if (current == null) {
              return
            }
            map.setCenter(new google.maps.LatLng(current.lat, current.lng))
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

        angular.forEach(scope.$eval(attrs.gmListeners), function (listener, key) {
          google.maps.event.addListener(map, key, function () {
            scope.safeApply(function () {
              listener()
            })
          })
        })

        angular.forEach(scope.$eval(attrs.gmListenersOnce), function (listener, key) {
          google.maps.event.addListenerOnce(map, key, function () {
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

      if (typeof attrs.gmVisible === 'undefined')
        attrs.gmVisible = "true"

      return {
        pre: function(scope, element, attrs) {

          var domElement = element[0]

          var map = scope.getMap()

          var position = attrs.gmPosition || "LEFT_TOP"

          scope.hide = function() {
            var index = map.controls[google.maps.ControlPosition[position]].indexOf(domElement)
            if (index > -1)
              map.controls[google.maps.ControlPosition[position]].removeAt(index)
          }

          scope.show = function() {
            
          var index = map.controls[google.maps.ControlPosition[position]].indexOf(domElement)
          if (index < 0)
            map.controls[google.maps.ControlPosition[position]].push(domElement)
          }

          if (attrs.gmVisible) {
            scope.$watch(attrs.gmVisible, function(current) {
              if (current === true)
                scope.show()
              else
                scope.hide()
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
 * InfoWindow. Expects $scope.getMap() and $scope.getMarker() to be available. Publishes $scope.openInfoWindow() and $scope.closeInfoWindow().
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

          scope.openInfoWindow = function() {
            infoWindow.open(scope.getMap(), scope.getMarker())
          }

          scope.closeInfoWindow = function() {
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
 * Overlapping Marker Spiderfier. Expects $scope.getMap() to be available. Publishes $scope.getOverlappingMarkerSpiderfier(). Triggers gm_oms_click google maps event when a marker is clicked.
 *
 * Requires https://cdn.rawgit.com/srizzo/OverlappingMarkerSpiderfier/0.3.3/dist/oms.min.js
 *
 */
.directive('gmOverlappingMarkerSpiderfier', function() {
  return {
    restrict: 'AE',
    scope: true,
    link: function(scope, element) {

      element.css("display", "none")

      var oms = new OverlappingMarkerSpiderfier(scope.getMap(), {
        keepSpiderfied: true
      })
      
      scope.getOverlappingMarkerSpiderfier = function () {
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
})

/**
 * @description
 *
 * Marker. Expects $scope.getMap() to be available.  Publishes $scope.getMarker(). Emits gm_marker_created and gm_marker_destroyed angularjs events.
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
            map: scope.getMap(),
            data: scope.$eval(attrs.gmData),
            title: scope.$eval(attrs.gmTitle),
            optimized: scope.$eval(attrs.gmOptimized),
            position: new google.maps.LatLng(scope.$eval(attrs.gmPosition).lat, scope.$eval(attrs.gmPosition).lng)
            
          })

          scope.getMarker = function () {
            return marker
          }

          if (attrs.gmIcon) {
            var unbindIconWatch = scope.$watch(attrs.gmIcon, function(current) {
              marker.setIcon(current)
            })
          }

          scope.$emit("gm_marker_created", marker)

          scope.$on("$destroy", function() {
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
          
          angular.forEach(scope.$eval(attrs.gmListeners), function (listener, key) {
            google.maps.event.addListener(marker, key, function () {
              scope.safeApply(function () {
                listener()
              })
            })
          })

          angular.forEach(scope.$eval(attrs.gmListenersOnce), function (listener, key) {
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
        
        angular.forEach(scope.$eval(attrs.gmListeners), function (listener, key) {
          scope.$eval(attrs.gmTo).addListener(key, function () {
            scope.safeApply(function () {
              listener()
            })
          })
        })

        angular.forEach(scope.$eval(attrs.gmListenersOnce), function (listener, key) {
          scope.$eval(attrs.gmTo).addListenerOnce(key, function () {
            scope.safeApply(function () {
              listener()
            })
          })
        })
      
      }
    }
  }
})
