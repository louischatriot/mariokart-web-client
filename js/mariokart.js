var mariokart = (function () {
  var apiRoot = "http://localhost:5555"
    , leaderboard = []
    , leaderboardTemplate = $('#leaderboard-template').html()
    , eventLog = []
    , eventLogAlreadySeen = {}
    , eventLogTemplate = $('#event-log-template').html()
    , bananaPeelsPositions = []
    , googleMapsAPIKey = "AIzaSyB7WBsXgjBcMbgUCy4jBzmeTJYcF38eSgc"
    , localmotionHQ = new google.maps.LatLng(37.567746, -122.325631)
    ;

  this.init = function () {
    var self = this;
  
    console.log("Mariokart single page app started")
    
    // this.updateLeaderboard(function (err) {
      // if (err) { return; }   // Shouldn't happen!
      
      // self.redrawLeaderboard();
    // });
    

    // this.updateEventLog(function (err) {
      // if (err) { return; }
      
      // self.redrawEventLog();
    // });
    
    this.updateBananaPeelsPositions(function (err) {
      if (err) { return; }
    
      console.log("=================");
      console.log(bananaPeelsPositions);
      self.redrawMap();
    });
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
      
    console.log(events);
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
   * Redraw map
   */
  this.redrawMap = function () {
    var containerId = "live-map"
      , mapOptions = {}
      , map
      ;
    
    mapOptions.center = localmotionHQ;    
    mapOptions.zoom = 15;
    
    map = new google.maps.Map(document.getElementById(containerId), mapOptions);
        
    bananaPeelsPositions.forEach(function(banana) {
      new google.maps.Marker({ position: new google.maps.LatLng(banana.lat - 0.0008, banana.lon)
                             , map: map
                             , title:"Banana"
                             , icon: "assets/img/banana-roadsign-small.png"
                             });    
    });

  };
  
  // Return mariokart opbject
  return this;
})();









