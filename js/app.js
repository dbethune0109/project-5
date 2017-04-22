"use strict"

var map, infowindow, pre;
var markers = [];
var hospitalLocations = [{
  name: 'Providence Portland Medical Center',
  address: '4805 NE Glisan St, Portland, OR 97213',
  location: {lat: 45.5275, lng: -122.6134},
  url: 'hhttp://oregon.providence.org/',
  contact: '(503) 215-1111'
}, {
  name: 'Portland Shriners Hospital',
  address: '3101 SW Sam Jackson Park Rd, Portland, OR 97239',
  location: {lat: 45.500843, lng: -122.684262},
  url: 'https://www.shrinershospitalsforchildren.org/Locations/portland',
  contact: "(503) 241-5090"
}, {
  name: 'Adventist Medical Center',
  address: '10123 SE Market St, Portland, OR 97216',
  location: {lat: 45.5234, lng: -122.6809},
  url: 'https://www.adventisthealth.org',
  contact: '(503) 257-2500'
}, {
  name: 'Legacy Good Samaritan Hospital & Medical Center',
  address: '1015 NW 22nd Ave, Portland, OR 97210',
  location: {lat: 45.5302, lng: -122.6975},
  url: 'http://www.legacyhealth.org/',
  contact: ' (503) 413-7711'
}, 
];

// Knockout utility function not included in minified released version
ko.utils.stringStartsWith = function (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length)
        return false;
    return string.substring(0, startsWith.length) === startsWith;
}

//initial callback function for when google api successfully loads and creates map object
function initMap() {
  var location = {lat: 45.5135, lng: -122.6801};

  map = new google.maps.Map(document.getElementById('map'), {
    center: location,
    zoom: 12
  });
  infowindow = new google.maps.InfoWindow();

  //Create markers for each hospital location in hospitalLocations object by calling createdMarker()
  hospitalLocations.forEach(function(hospital) {
    createMarker(hospital);
  });
}

/*
  @desc creates marker to display on google map and calls createInfoWindow to create infowindow for each marker
  @para object hospital - used for creating marker properties
*/
function createMarker(hospital) {
  var marker = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.DROP,
    position: hospital.location,
    name: hospital.name,
    address: hospital.address,
    webpage: hospital.url,
    phone: hospital.contact

  });
  markers.push(marker);
  hospital.marker = marker;
  google.maps.event.addListener(marker, 'click', function() { //binds click event on each marker
    createInfoWindow(marker, infowindow);
  });
}

/*
  @desc creates infowindow and sets marker animation for each hospital location and makes ajax request to wikipedia for relevant article
  @para object marker - used for wiki ajax calls and populating infowindow with infomation
        object infowindow - displays hospital infomation
*/
function createInfoWindow(marker, infowindow) {
  var wikiUrl = "http://en.wikipedia.org/w/api.php?action=opensearch&search=" + marker.name + "&format=json&callback=wikiCallback";
  var wikiApiTimeout = setTimeout(function() { //Alerts user after 5 seconds if the ajax call to wikipedia is unsuccessful
    alert("Error retrieving wikipedia link.");
  }, 5000);

  $.ajax(wikiUrl, {
      dataType: "jsonp",
      success: function(response) {
        clearTimeout(wikiApiTimeout); //clears previous timeout ID when ajax call is successful
        var wikiPage = response[3][0];

        //sets previous clicked marker color back to default
      if (pre !== undefined) {
        pre.setIcon(null);
      }
      pre = marker;
      marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png'); //when clicked marker changes color and bounces
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          marker.setAnimation(null);
        },1400);
      }

        infowindow.setContent("<div class='infoWindow'><h3 class='infoTitle'>" + marker.name + "</h3><br><p>" + marker.address +"</p><br><p>" + marker.phone + "</p><br><p><a href='" + marker.webpage + "'>Homepage</a></p><br><p><a href='" + wikiPage + "'>Wiki Page</a></p></div>");
        infowindow.open(map, marker);
      }
  });
}

//error function, fires when google map failed to load
function mapLoadFail() {
  alert("Google Map failed to load! Please check internet connection or firewall settings.");
}

//Knockout.js ViewModel object
var mapViewModel = function() {
  var self = this;

  self.hospitals = ko.observable(hospitalLocations);
  self.filterQuery = ko.observable('');
  self.filteredItems = ko.computed(function() {
    var filter = self.filterQuery().toLowerCase();
    if (!filter) { //if search field is empty, show all markers
        markers.forEach(function(item) {
          item.setVisible(true);
        });
        return self.hospitals();
    } else {
        return ko.utils.arrayFilter(self.hospitals(), function(item) { //filters hospital array for elements that match the text input from search field
            if (ko.utils.stringStartsWith(item.name.toLowerCase(), filter)) {
              item.marker.setVisible(true);
              return true;
            } else {
              item.marker.setVisible(false);
              return false;
            }
        });
    }
  }, self);

  //invokes when list-item inside sidebar is clicked, re-centers the map to chosen location and opens infowindow
  self.listClick = function(hospital) {
    map.setZoom(18);
    map.setCenter(hospital.location);
    createInfoWindow(hospital.marker, infowindow);
  }
};

ko.applyBindings(new mapViewModel());

//toggle sidebar
$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});