describe('overlapping-marker-spiderfier directive', function() {
  
  var map = element(by.id('map'));
  var marker1 = element(by.css("*[title='Marker 1']"));
  var marker2 = element(by.css("*[title='Marker 2']"));
  var marker3 = element(by.css("*[title='Marker 3']"));
  var infoWindow1 = element(by.cssContainingText('p', 'Info Window 1 Content'));

  beforeEach(function() {
    browser.get('/test/e2e/overlapping-marker-spiderfier-directive.html');
  });

  it('should spiderfy on click', function() {
    marker3.click();
    marker1.getLocation().then(function (location1) {
      marker2.getLocation().then(function (location2) {
        marker3.getLocation().then(function (location3) {
          expect(location2).not.toEqual(location1);
          expect(location3).not.toEqual(location1);
        });
      });
    });
  });

  it('should open the marker info window on marker click', function() {
    marker3.click();
    marker1.click();
    expect(infoWindow1.isDisplayed()).toBe(true);
  });


});