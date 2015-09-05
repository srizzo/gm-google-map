gm-google-map
=============

gm-google-map is a tiny library for using Google Maps with AngularJS, extracted from a real world project. For a more complete library, you can try [http://github.com/angular-ui/angular-google-maps](http://github.com/angular-ui/angular-google-maps)

## Usage

A map:

    <div gm-map-canvas center="{ lat: 53.4152431, lng: -8.2390307 }" zoom="7" style="height: 400px; width: 400px;"></div>

A map, with markers and info windows:

    <gm-map-context>
      <div gm-map-canvas center="{ lat: 53.4152431, lng: -8.2390307 }" zoom="7" style="height: 400px; width: 400px;"></div>
      <gm-add-ons>
        <gm-marker ng-repeat="i in [1,2,3]" title="'Marker {{i}}'" position="{ lat: 53.4152431, lng: (-10.2390307 + i) }">
          <div gm-info-window>
            <gm-add-listeners to="$getMarker()" listeners="{ click: '$openInfoWindow()' }"></gm-add-listeners>
            <p>Info Window {{i}} Content</p>
          </div>
        </gm-marker>        
      </gm-add-ons>
    </gm-map-context>

Demos and more examples at [http://srizzo.github.io/gm-google-map/](http://srizzo.github.io/gm-google-map/)

## Download

You can download the latest, minified version at [https://cdn.rawgit.com/srizzo/gm-google-map/0.0.6/dist/gm-google-map.min.js](https://cdn.rawgit.com/srizzo/gm-google-map/0.0.6/dist/gm-google-map.min.js).

