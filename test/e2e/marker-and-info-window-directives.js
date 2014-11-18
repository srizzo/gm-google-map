describe('marker and info-window directives', function() {
  
  var map = element(by.id('map'));
  var marker = element(by.css("*[title='Marker 1']"));
  var infoWindow = element(by.cssContainingText('p', 'Info Window 1 Content'));

  beforeEach(function() {
    browser.get('/test/e2e/marker-and-info-window-directives.html');
  });

  it('should display a marker', function() {
    expect(marker.isDisplayed()).toBe(true);
  });

  it('should open an info window on click', function() {
    marker.click();
    expect(infoWindow.isDisplayed()).toBe(true);
  });


});