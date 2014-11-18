describe('map-canvas directive', function() {
  
  var map = element(by.id('map'));

  describe("with declared attributes", function() {

    beforeEach(function() {
      browser.get('/test/e2e/map-canvas-directive.html');
    });

    it('should center accordingly', function() {
      map.evaluate("getMap().getCenter().lat().toFixed(7) + ', ' + getMap().getCenter().lng().toFixed(7)").then(function (center) {
        expect(center).toEqual('53.4152431, -8.2390307');
      });
    });
  
    it("should zoom accordingly", function() {
      map.evaluate("getMap().getZoom()").then(function (zoom) {
        expect(zoom).toEqual(7);
      });
    });

  });
});