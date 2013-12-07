// Bad Hackathon code with memory leaks everywhere!!!

var mariokart = (function () {
  var apiRoot = "http://localhost:5555"
  // var apiRoot = "http://dogfood.getlocalmotion.com"
    , leaderboard = []
    , leaderboardTemplate = $('#leaderboard-template').html()
    , eventLog = []
    , eventLogAlreadySeen = {}
    , eventLogTemplate = $('#event-log-template').html()
    , bananaPeelsPositions = []
    // , googleMapsAPIKey = "AIzaSyB7WBsXgjBcMbgUCy4jBzmeTJYcF38eSgc"
    , localmotionHQ = new google.maps.LatLng(37.567746, -122.325631)
    , carsPositions = []
    , map
    , currentBananaMarkers = []
    , currentCarsMarkers = []
    ;

  this.init = function () {
    var self = this;
  
    console.log("Mariokart single page app started")
    
    // this.updateLeaderboard(function (err) {
      // if (err) { return; }   // Shouldn't happen!
      
      // self.redrawLeaderboard();
    // });
    

    this.updateEventLog(function (err) {      
      self.redrawEventLog();
    });
    

    
    
    // Draw map
    this.updateBananaPeelsPositions(function (err) {
      this.updateCarsPositions(function (err) {
        self.redrawMap();
      });
    });
    
    // Update everything real time
    var thei = setInterval(function() {
      self.updateCarsPositions(function(err) {
        self.replaceCarsMarkers();      
      });
      self.updateBananaPeelsPositions(function(err) {
        self.replaceBananasMarkers();      
      });
      this.updateEventLog(function (err) {      
        self.redrawEventLog();
      });      
    }, 800);
    
    setTimeout(function () {
      clearInterval(thei);
    }, 5000);
  };

  /**
   * Get the latest status of the leaderboard and update the internal represnetation
   * Callback(err)
   */
  this.updateLeaderboard = function (cb) {
    var callback = cb || function() {};
  
    $.ajax({ url: apiRoot + "/su/mariokart/api/leaderboard" }).done(function (data) {
      data = data.sort(function (a, b) { return b.score - a.score; });
      leaderboard = data;
      return callback(null);
    }).fail(function () {
      console.log("Couldn't get the current status of the leaderboard")
      return callback("ERROR_GETTING_LEADERBOARD_DATA");
    });
  };

  /**
   * Redraw the leaderboard
   */
  this.redrawLeaderboard = function () {
    var $container = $('#leaderboard');
    $container.html(Mustache.render(leaderboardTemplate, { scores: leaderboard }));
  };

  /**
   * Get the latest events   
   * Callback(err)
   */
  this.updateEventLog = function (cb) {
    var callback = cb || function () {};
    
    $.ajax({ url: apiRoot + "/su/mariokart/api/lastEvents" }).done(function (data) {
      console.log('--------------');
      console.log(data);
    
      data.forEach(function (item) {
        item.timestamp = new Date(item.timestamp);
        item.timeago = moment(item.timestamp).fromNow();
        item.hashCode = CryptoJS.MD5(JSON.stringify(item)).toString();
        item[item.type] = true;
      });
      data = data.sort(function (a, b) { return a.timestamp.getTime() - b.timestamp.getTime(); });
      data.forEach(function (item) {
        if (eventLogAlreadySeen[item.hashCode]) { return; }   // This event is already in the event log
        eventLog.unshift(item);
        eventLogAlreadySeen[item.hashCode] = true;
      });
      return callback(null);
    }).fail(function () {
      console.log("Couldn't get the latest events")
      return callback("ERROR_GETTING_EVENT_DATA");
    });     
  };

  /**
   * Redraw the event log
   */
  this.redrawEventLog = function () {
    var $container = $('#event-log')
      , maxDrawnEvents = 100
      , i, events = []
      ;
      
    for (i = 0; i < Math.min(maxDrawnEvents, eventLog.length); i += 1) {
      events.push(eventLog[i]);
    }
      
    $container.html(Mustache.render(eventLogTemplate, { events: events }));
  };
  
  /**
   * Update the banana peels positions
   */
  this.updateBananaPeelsPositions = function (cb) {
    var callback = cb || function() {};
  
    $.ajax({ url: apiRoot + "/su/mariokart/api/bananaPeelsPositions" }).done(function (data) {
      bananaPeelsPositions = data;
      return callback(null);
    }).fail(function () {
      console.log("Couldn't get the current positions of banana peels")
      return callback("ERROR_GETTING_BANANAPEELS_POSITIONS_DATA");
    });  
  };
  
  /**
   * Update the cars positions
   */
  this.updateCarsPositions = function (cb) {
    var callback = cb || function() {};
  
    $.ajax({ url: apiRoot + "/su/mariokart/api/carsPositions" }).done(function (data) {
      carsPositions = data;
      return callback(null);
    }).fail(function () {
      console.log("Couldn't get the current positions of cars")
      return callback("ERROR_GETTING_BANANAPEELS_POSITIONS_DATA");
    });   
  };
  
  /**
   * Redraw map
   */
  this.redrawMap = function () {
    var containerId = "live-map"
      , mapOptions = {}
      ;
    
    mapOptions.center = localmotionHQ;    
    mapOptions.zoom = 17;
    
    map = new google.maps.Map(document.getElementById(containerId), mapOptions);

    this.replaceBananasMarkers();
    this.replaceCarsMarkers();
  };
  
  /**
   * Place all banana roadsigns after removing all stale markers
   */
  this.replaceBananasMarkers = function (_offset) {
    var offset = _offset || 0;
  
    currentBananaMarkers.forEach(function(marker) { marker.setMap(null); });
  
    // Place banana peels
    bananaPeelsPositions.forEach(function(banana) {
      var marker =  new google.maps.Marker({ position: new google.maps.LatLng(banana.lat /*- 0.0008*/, banana.lon - offset)   // Small hack to center the banana peel roadsign
                                           , map: map
                                           , title:"Banana"
                                           , icon: "assets/img/banana-roadsign-small.png"
                                           });
                                           
      currentBananaMarkers.push(marker);
    });  
  };
  
  /**
   * Place all banana roadsigns after removing all stale markers
   */
  this.replaceCarsMarkers = function (_offset) {
    var offset = _offset || 0;
  
    currentCarsMarkers.forEach(function(marker) { marker.setMap(null); });
  
    // Place banana peels
    carsPositions.forEach(function(car) {
      var marker =  new google.maps.Marker({ position: new google.maps.LatLng(car.lat, car.lon - offset)
                                           , map: map
                                           , title: car.driver.name
                                           });
                                           
      currentCarsMarkers.push(marker);
    });  
  };  
  
  
  // Return mariokart opbject
  return this;
})();









