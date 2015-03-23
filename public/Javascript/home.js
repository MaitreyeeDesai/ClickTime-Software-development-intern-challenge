/**
 * New node file
 */

var travelMode = 1;
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var stepDisplay;
var placesOnRoute = new Array();

jQuery(document).ready(
		function() {
			// get user's location and initialize the map with that as it's
			// center

			getMyLocation();
			// event binding for tab switch: Steps and Map
			jQuery('.tabs .tab-links a').on(
					'click',
					function(e) {
						var currentAttrValue = jQuery(this).attr('href');
						// Show/Hide Tabs
						jQuery('.tabs ' + currentAttrValue).show().siblings()
								.hide();

						// Change/remove current tab to active
						jQuery(this).parent('li').addClass('active').siblings()
								.removeClass('active');

						e.preventDefault();
					});

			// event binding for way of navigation change: walking, transit, and
			// cycle

			$("#travel-mode li").click(
					function() {
						travelMode = this.id;
						if (this.id == 2) {
							$(this).children('button').removeClass("walking")
									.addClass("walking-selected");

						}
						if (this.id == 3) {
							$(this).children('button').removeClass("cycle")
									.addClass("cycle-selected");

						}
						calcRoute();
					});

		});

// Initialize the map with center values passed as parameters
function initialize(latitude, longitude) {
	directionsDisplay = new google.maps.DirectionsRenderer();
	var userLocation = new google.maps.LatLng(latitude, longitude);
	var mapOptions = {
		zoom : 13,
		center : userLocation
	}
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	directionsDisplay.setMap(map);
	stepDisplay = new google.maps.InfoWindow();
}

// calculate and draw the route on the map. Also get step wise instructions and
// display them in the "Steps" tab
function calcRoute() {
	// get start location
	var start = $("#from-location").val();
	// get end location
	var end = $("#to-location").val();
	var travelWay; // mode of travel
	// validations for start location
	if (typeof (start) == "undefined" || start == "") {
		$(".search-button").jAlert("Please enter a start location.");
		return;
	}
	// validations for end location
	if (typeof (end) == "undefined" || end == "") {
		$(".search-button").jAlert("Please enter an end location.");
		return;
	}
	// set travel mode
	if (travelMode == 1) {
		// public
		travelWay = google.maps.TravelMode.TRANSIT;
	}
	if (travelMode == 2) {
		// walking
		travelWay = google.maps.TravelMode.WALKING;

	}
	if (travelMode == 3) {
		travelWay = google.maps.TravelMode.BICYCLING;
		// cycling
	}
	// prepare request object with start, end and mode of navigation
	var request = {
		origin : start,
		destination : end,
		travelMode : travelWay
	};
	// make a call the Google direction service with a registered callback
	// function
	directionsService
			.route(
					request,
					function(result, status) {
						// check if the request was successful
						if (status == google.maps.DirectionsStatus.OK) {
							// draw the route on the map
							directionsDisplay.setDirections(result);
							// add the step wise instructions to the Steps tab
							showSteps(result);
							// find places for Coffee and donuts using Google
							// place library with the start point as the end
							// location

							var geocoder = new google.maps.Geocoder();
							// geocode the end location to get the address in
							// latitude and longitude
							geocoder
									.geocode(
											{
												'address' : end
											},
											function(results, status) {
												// check if the request was
												// success
												if (status == google.maps.GeocoderStatus.OK) {
													// set the query search as
													// entered by the user:
													// default set to "Coffee
													// and Donuts" but can be
													// changed
													var querySearch = $(
															"#place-query")
															.val();
													// validate the input if set
													// to nothing set it default
													// to "Coffee and Donuts"
													if (typeof (querySearch) == "undefined"
															|| querySearch == "") {
														querySearch = "Coffee and Donuts";
														$("#place-query").val(
																querySearch)

													}
													// form a request with the
													// query search string,
													// radius and location
													var request = {
														location : results[0].geometry.location,
														radius : '500',
														query : querySearch
													};
													// form a new object for the
													// place service
													service = new google.maps.places.PlacesService(
															map);
													// make the call and
													// register a callback
													// function
													service
															.nearbySearch(
																	request,
																	drawMarkersForPlaces);

												} else {
													// if the geocode was not
													// success then show a
													// message
													alert('Geocode was not successful for the following reason: '
															+ status);
												}
											});

						}

					});
}

// draw markers for the places requested on the route
function drawMarkersForPlaces(results, status) {
	// check if the request was success
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		// if yes iterate the list of places and draw markers
		for (var i = 0; i < results.length; i++) {
			var place = results[i];
			createMarker(results[i]);
			// also push the places name in the global variable array to be
			// printed later in a list form
			placesOnRoute.push(place);
		}
		// print the places in a list form
		showPlacesInList();
	}
}

// append the list of places in the "Steps" tab
function showPlacesInList() {
	// empty the list div
	$("#places").empty();
	// append the title
	$("#places").append("<p><b>Places requested on the route</b></p>");
	// add the places to a list and append it to the div
	for (var i = 0; i < placesOnRoute.length; i++) {
		var location = placesOnRoute[i].name;
		var count = parseInt(i) + 1;
		$("#places").append("<p>" + count + ". " + location + ".");

	}

}
// draw markers for specified lat, long object
function createMarker(latLng) {
	// customize the marker image
	var img = "/images/green-marker.png";
	// draw the marker on the map
	var marker = new google.maps.Marker({
		position : latLng.geometry.location,
		map : map,
		title : latLng.name,
		icon : img

	});
	// attach the place names as window info: it will be shown when the marker
	// is clicked
	attachInstructionText(marker, latLng.name);
}

// attach the instruction text and event for the marker click
function attachInstructionText(marker, text) {
	// attach the event
	google.maps.event.addListener(marker, 'click', function() {
		// Open an info window when the marker is clicked on,
		// containing the text of the step.
		stepDisplay.setContent(text);
		stepDisplay.open(map, marker);
	});
}

// swap the start and end locations
function swapLocations() {
	var fromLocation = $("#from-location").val();
	var toLocation = $("#to-location").val();
	$("#from-location").val(toLocation);
	$("#to-location").val(fromLocation);

}

// get user location using the navigator object of HTML
function getMyLocation() {
	if (navigator.geolocation) {
		// get the current location and attach the callbacks for success and
		// errors
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	} else {
		// if the navigator object is not supported by the browser
		alert("The browser does not support the navigator object!!!");
	}

}

// success callback for navigator location object
function showPosition(position) {

	// using the geocoder object convert the position obtained by the navigator
	// object into "Human readable address"
	var geocoder = new google.maps.Geocoder();
	var lat = parseFloat(position.coords.latitude);
	var lng = parseFloat(position.coords.longitude);
	var latlng = new google.maps.LatLng(lat, lng);
	// make the call for reverse geo-coding
	geocoder.geocode({
		'latLng' : latlng
	}, function(results, status) {
		// check if the request was successful
		if (status == google.maps.GeocoderStatus.OK) {
			// validate the response and get the address
			if (results[0]) {
				// set the "FROM LOCATION" as the user's current location
				$("#from-location").val(results[0].formatted_address);
				// initialize the map with the user's current location as the
				// center
				initialize(lat, lng);

			}
		} else {
			// handling for the request failure
			alert("Geocoder failed due to: " + status);
		}
	});
}

// error handling callback for navigator object
function showError(error) {
	switch (error.code) {
	case error.PERMISSION_DENIED:
		// if user refuses to give location get by ip address
		// alert("User denied permissions!");
		getLocationByIP();
		break;
	case error.POSITION_UNAVAILABLE:
		alert("We are currently not able to get your location!!");
		break;
	case error.TIMEOUT:
		alert("Request timeout due to some reason. Please refresh your page and try again!");
		break;
	case error.UNKNOWN_ERROR:

		break;
	}
}

// get the user readable address of the user's location using the reverse
// geocoding service of google direction API
function getLocationByIP() {
	// ajax get call to the "ipinfo.io" : async call made
	$
			.get(
					"http://ipinfo.io",
					function(response) {
						// get geocoder object
						var geocoder = new google.maps.Geocoder();
						var latLongString = response.loc;
						var locArray = latLongString.trim().split(',');
						if (locArray.length == 0) {
							alert("Please allow the browser to use your location!");
							return;
						}
						var lat = parseFloat(locArray[0]);
						var lng = parseFloat(locArray[1]);
						if (lat == "" || lng == ""
								|| typeof (lat) == "undefined"
								|| typeof (lng) == "undefined") {
							alert("Please refresh your page and allow the browser to use your location.");
							return;
						}
						var latlng = new google.maps.LatLng(lat, lng);
						// make the service call
						geocoder.geocode({
							'latLng' : latlng
						}, function(results, status) {
							// check if the request was a success
							if (status == google.maps.GeocoderStatus.OK) {
								// validate the response
								if (results[0]) {
									// set the address as from location in the
									// from
									$("#from-location").val(
											results[0].formatted_address);
									// initialize the map with its center
									initialize(lat, lng);

								}
							} else {
								// failure handling if the geocoder request
								// fails
								
							}
						});

					}, "jsonp");

}

// append the stepwise instructions for the route specified to the tab
// dynamically
function showSteps(directionResult) {
	// get the steps array
	var myRoute = directionResult.routes[0].legs[0];
	// empty the div of previous results
	$("#steps").empty();
	// append the title
	$("#steps").append("<p><b>Step wise instructions</b></p>");
	// iterate the steps array
	for (var i = 0; i < myRoute.steps.length; i++) {
		var instruction = myRoute.steps[i].instructions;
		var count = parseInt(i) + 1;
		// append the steps to the div
		$("#steps").append("<p>" + count + ". " + instruction + "</p>");

	}

}