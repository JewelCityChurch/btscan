var Bleacon = require('bleacon');
var request = require("request");

var config = require('./config.json');

var beacons = {};

Bleacon.startScanning(config.uuid);

Bleacon.on('discover', function(beacon) {
	beacon.lastSeen = new Date().getTime();
	var bID = beacon.major + '.' + beacon.minor;
	beacon.bID = bID;
	if (! beacons[bID]) newBeacon(beacon);
	beacons[bID] = beacon;
});

var lastSeenInterval = setInterval(function()  {
	var currTime = new Date().getTime();
	for (const key in beacons) {
		var beacon = beacons[key];
		if(currTime - beacon.lastSeen > config.lastSeenMax) {
			console.log( currTime - beacon.lastSeen );
			lostBeacon(beacon);
			delete beacons[key];
		}
	};
}, config.lastSeenInterval);

var updateAllInterval = setInterval(function()  {
	request.post(config.bttrackBase + '/beaconUpdate', beacons)
		.on('error', function(err) { console.log(err.code) });
}, config.updateInterval);

var newConfigInterval = setInterval(function() {
	request.get(config.configURI, function(err, response, body) {
		if(!err) {
			var newConfig = JSON.parse(body);
			if( newConfig && newConfig.btscan-config && newConfig.btscan-config === 1) {
				config = JSON.parse(body);
			}
		}
	}).on('error', function(err) { console.log(config.configURI, err.code) });
}, config.newConfigInterval);

function newBeacon(beacon) {
	console.log(beacon);
	console.log('new beacon : ' + beacon.bID);
	request.post(config.bttrackBase + '/encounter', beacon)
		.on('error', function(err) { console.log(config.bttrackBase + '/encounter', err.code) });
}

function lostBeacon(beacon) {
	console.log('beacon ' + beacon.bID + ' is gone');
	request.post(config.bttrackBase + '/lostBeacon', beacon)
		.on('error', function(err) { console.log(config.bttrackBase + '/lostBeacon', err.code) });
}