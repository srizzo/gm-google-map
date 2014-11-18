describe('control directive', function() {
  
  var map = element(by.id('map'));
  var control = element(by.css(".control1"));

  beforeEach(function() {
    browser.get('/test/e2e/control-directive.html');
  });

  it('should display the control', function() {
    expect(control.isDisplayed()).toBe(true);
  });

});