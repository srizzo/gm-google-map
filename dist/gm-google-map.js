angular.module('gm-google-map', [])
.directive('gmMapContext', function() {
  return {
    scope: true,
    restrict: 'EA',
    controller: function ($scope) {
      var _map;
      $scope.setMap = function (map) {
        _map = map
      }
      this.getMap = function () {
        return _map
      }
      $scope.getMap = function () {
        return _map
      }
    }
  }
})
.directive('gmMapCanvas', function() {
  return {
    scope: true,
    restrict: 'EA',
    require: '^?gmMapContext',
    link: {
      pre: function (scope, element, attrs) {

        var map = new google.maps.Map(element.get(0), {
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: true,
          styles: [{
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{
              visibility: 'off'
            }]
          }, {
            draggable: false
          }]
        })

        window.Map = map
        
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
          })
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
    scope: false,
    restrict: 'EA',
    require: '^gmMapContext',
    compile: function (element) {
      element.hide()
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

          var domElement = element.get(0)

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
})
.directive('gmInfoWindow', function() {
  return {
    require: '^gmMapContext',
    scope: true,
    link: function(scope, element, attrs) {
      var domElement = element.get(0)

      var infoWindow = new google.maps.InfoWindow()
      infoWindow.setContent(domElement)

      if (attrs.closeclick) {
        infoWindow.addListener('closeclick', function() {
          scope.$apply(function() {
            scope.$eval(attrs.closeclick)
          })
        })
      }

      scope.open = function(marker) {
        infoWindow.open(scope.getMap(), marker)
      }

      scope.close = function() {
        infoWindow.close()
      }
    }
  }
})
.directive('gmOverlappingMarkerSpiderfier', function() {
  return {
    restrict: 'AE',
    scope: true,
    require: '^gmMapContext',
    link: function(scope, element, attrs) {

      element.hide()

      var oms = new OverlappingMarkerSpiderfier(scope.getMap(), {
        keepSpiderfied: true
      })

      scope.$on("marker_created", function (event, marker) {
        oms.addMarker(marker)
      })

      scope.$on("marker_destroyed", function (event, marker) {
        oms.removeMarker(marker)
      })

      oms.addListener('click', function(marker) {
        scope.$apply(function() {
          scope.$eval(attrs.gmClick, { marker: marker })
        })
      })

    }
  }
})
.directive('gmMarker', function() {
  return {
    restrict: 'AE',
    scope: true,
    require: '^gmMapContext',
    link: function(scope, element, attrs) {

      var marker = new google.maps.Marker({
        map: scope.getMap(),
        data: scope.$eval(attrs.gmData),
        title: scope.$eval(attrs.gmTitle),
        optimized: scope.$eval(attrs.gmOptimized),
        position: new google.maps.LatLng(scope.$eval(attrs.gmLat), scope.$eval(attrs.gmLng))
      })

      var unbindIconWatch = scope.$watch(attrs.gmIcon, function(current) {
        marker.setIcon(current)
      })

      scope.$emit("marker_created", marker)

      scope.$on("$destroy", function() {
        unbindIconWatch()
        marker.setMap(null)
        scope.$emit("marker_destroyed", marker)
      })

    }
  }

})

