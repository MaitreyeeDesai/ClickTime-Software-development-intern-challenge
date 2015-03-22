/**
 * New node file
 */

var travelMode = 1;
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var stepDisplay;
var placesOnRoute=new Array();

jQuery(document).ready(
		function() {
			// get user's location and initialize the map with that as its
			// center
			getMyLocation();
			// event binding for tab switch
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

			// event binding for way of navigation change

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

// Initialize the map with certain values
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

function calcRoute() {
	var start = $("#from-location").val();
	var end = $("#to-location").val();
	var travelWay;
	if (typeof (start) == "undefined"|| start == "") {
		 $(".search-button").jAlert("Please enter a start location.");
		return;
	}
	if (typeof (end) == "undefined"|| end == "") {
		$(".search-button").jAlert("Please enter an end location.");
		return;
	}
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
	var request = {
		origin : start,
		destination : end,
		travelMode : travelWay
	};
	directionsService
			.route(
					request,
					function(result, status) {
						if (status == google.maps.DirectionsStatus.OK) {
							directionsDisplay.setDirections(result);
							showSteps(result);
							// find places for coffee and donuts
							// set the location as start location
							var geocoder = new google.maps.Geocoder();
							geocoder
									.geocode(
											{
												'address' : end
											},
											function(results, status) {
												if (status == google.maps.GeocoderStatus.OK) {
													var querySearch = $(
															"#place-query")
															.val();
													if (typeof (querySearch) == "undefined"
															|| querySearch == "") {
														querySearch = "Coffee and Donuts";
														$("#place-query").val(
																querySearch)

													}

													var request = {
														location : results[0].geometry.location,
														radius : '500',
														query : querySearch
													};

													service = new google.maps.places.PlacesService(
															map);
													service
															.nearbySearch(
																	request,
																	drawMarkersForPlaces);

												} else {
													alert('Geocode was not successful for the following reason: '
															+ status);
												}
											});

						}

					});
}

function drawMarkersForPlaces(results, status) {
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			var place = results[i];
			createMarker(results[i]);
			placesOnRoute.push(place);
		}
		
		showPlacesInList();
	}
}

function showPlacesInList()
{
	$("#places").empty();
	$("#places").append("<p><b>Places requested on the route</b></p>");
	for (var i = 0; i < placesOnRoute.length; i++) {
		var location= placesOnRoute[i].name;
		var count= parseInt(i)+1;
		$("#places").append("<p>"+count+". "+ location+".");

	}

}

function createMarker(latLng) {
	var img="/images/green-marker.png";
	var marker = new google.maps.Marker({
		position : latLng.geometry.location,
		map : map,
		title : latLng.name,
		icon: img

	});
	attachInstructionText(marker, latLng.name);
}

function attachInstructionText(marker, text) {
	google.maps.event.addListener(marker, 'click', function() {
		// Open an info window when the marker is clicked on,
		// containing the text of the step.
		stepDisplay.setContent(text);
		stepDisplay.open(map, marker);
	});
}

function swapLocations() {
	var fromLocation = $("#from-location").val();
	var toLocation = $("#to-location").val();
	$("#from-location").val(toLocation);
	$("#to-location").val(fromLocation);

}

function getMyLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	} else {
		// x.innerHTML = "Geolocation is not supported by this browser.";
	}

}

function showPosition(position) {
	// position.coords.latitude , position.coords.longitude;
	var geocoder = new google.maps.Geocoder();
	var lat = parseFloat(position.coords.latitude);
	var lng = parseFloat(position.coords.longitude);
	var latlng = new google.maps.LatLng(lat, lng);
	geocoder.geocode({
		'latLng' : latlng
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[1]) {
				$("#from-location").val(results[0].formatted_address);
				initialize(lat, lng);
				/*
				 * infowindow.setContent(results[1].formatted_address);
				 * infowindow.open(map, marker);
				 */
			}
		} else {
			alert("Geocoder failed due to: " + status);
		}
	});
}

function showError(error) {
	switch (error.code) {
	case error.PERMISSION_DENIED:
		// if user refuses tp give location get by ip address
		getLocationByIP();
		break;
	case error.POSITION_UNAVAILABLE:

		break;
	case error.TIMEOUT:

		break;
	case error.UNKNOWN_ERROR:

		break;
	}
}

function getLocationByIP() {
	$.get("http://ipinfo.io", function(response) {
		console.log(response.city);
		var geocoder = new google.maps.Geocoder();
		var lat = parseFloat(response.latitude);
		var lng = parseFloat(response.longitude);
		var latlng = new google.maps.LatLng(lat, lng);
		geocoder.geocode({
			'latLng' : latlng
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if (results[1]) {
					$("from-location").val(results[0].formatted_address);
					initialize(lat, lng);

				}
			} else {
				alert("Geocoder failed due to: " + status);
			}
		});

	}, "jsonp");

}

function showSteps(directionResult) {
	var myRoute = directionResult.routes[0].legs[0];
	$("#steps").empty();
	$("#steps").append("<p><b>Step wise instructions</b></p>");
	for (var i = 0; i < myRoute.steps.length; i++) {
		var instruction = myRoute.steps[i].instructions;
		var count = parseInt(i) + 1;
		$("#steps").append("<p>" + count + ". " + instruction + "</p>");

	}

}