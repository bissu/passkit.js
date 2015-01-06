var crypto = require('crypto');
var https = require('https');

var publickey = '172f24fd2a903fc0647b61d7112ee1b9814702be';
var privatekey = '5883af339b287ec5235e79f48434247fa0c75633';

//////
// Internal Useful Methods
//
var formatTwoCaracters = function(value){
	if(value < 10){
		value = '0' + value;
	}
	return value;
};

var getTimestamp = function() {
	var now = new Date();
	var UTCYear = now.getUTCFullYear();
	var UTCMonth = formatTwoCaracters(now.getUTCMonth() + 1);
	var UTCDay = formatTwoCaracters(now.getUTCDate());
	var UTCHours = formatTwoCaracters(now.getUTCHours());
	var UTCMinutes = formatTwoCaracters(now.getUTCMinutes());
	var UTCSeconds = formatTwoCaracters(now.getUTCSeconds());
	var returnValue = UTCYear + '-' + UTCMonth + '-' + UTCDay + 'T' + UTCHours + ':' + UTCMinutes + ':' + UTCSeconds + 'Z';
	return returnValue;
};

var generateSignature = function(params, usertoken, returnUrl) {
	var timestamp = getTimestamp();
	var data1 = publickey + timestamp;
	var shasum = crypto.createHmac('sha1', privatekey);
	shasum.update(data1);
	var computedSignature = shasum.digest('base64');

	var signature = {
		publickey: publickey,
		signature: computedSignature,
		timestamp: timestamp
	};

	var urlParams = usertoken ? "&usertoken=" + usertoken : '';
	if (typeof params === 'object') {
		for (var key in params) {
			urlParams = urlParams + "&" + key + "=" + encodeURIComponent(params[key]);
		}
	}

	return '?publickey=' + encodeURIComponent(signature.publickey) + '&signature=' + encodeURIComponent(signature.signature) + '&timestamp=' + encodeURIComponent(signature.timestamp) + urlParams;
};

module.exports = {

	"request" : function(entity, id, resource, params, usertoken, callback) {

		var signature = generateSignature(params, usertoken);
		var url = "https://api.ingresse.com/" + entity;
		url = id ? url + "/" + id : url;              // Adding ID
		url = resource ? url + "/" + resource : url;  // Adding resource
		url = url + signature;                        // Adding signature

		https.get(url, function(res) {

			var jsonSting = "";

			res.on('data', function(d) {
				jsonSting = jsonSting + d;
			});

			res.on('end', function(){
				callback(JSON.parse(jsonSting));
			});

		}).on('error', function(e) {
			console.log("Got error: " + e.message);
		});

	}

};
