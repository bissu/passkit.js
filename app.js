var express = require('express');
var passkit = require('./passkit.js');
var app = express();

var certificates = {
	"appleWWDRCA" : "./certs/AppleWWDRCA.pem",
	"passCertificate" : "./certs/passcertificate.pem",
	"passKey" : "./certs/passkey.pem",
	"certPassword" : ""
};

var imageFiles = [
	'./images/background@2x.png',
	'./images/icon@2x.png',
	'./images/logo@2x.png',
	'./images/background.png',
	'./images/icon.png',
	'./images/logo.png'
];

var template = {
	"barcode" : {
		"message" : "25.1137.Q009706R.707655.06",
		"format" : "PKBarcodeFormatQR",
		"messageEncoding" : "iso-8859-1",
		"altText" : "25.1137.Q009706R.707655.06"
	},
	"foregroundColor" : "rgb(255, 255, 255)",
	"backgroundColor" : "rgb(60, 65, 76)",
	"eventTicket" : {
		"primaryFields" : [{
			"key" : "event",
			"label" : "EVENTO",
			"value" : "HOLI FESTIVAL DAS CORES",
			"textAlignment" : "PKTextAlignmentNatural",
			"changeMessage" : "Changed to %@"
		}],
		"secondaryFields" : [{
			"key" : "location",
			"label" : "LOCAL",
			"value" : "Parque do Ibirapuera",
			"textAlignment" : "PKTextAlignmentNatural",
			"changeMessage" : "Changed to %@"
		}],
		"backFields" : [
			{
				"key" : "owner",
				"label" : "dono do ingresso",
				"value" : "Rodrigo Mau\u00e9s"
			},
			{
				"key" : "address",
				"value" : "Parque do Ibirapuera\r\nAv. Pedro \u00c1lvares Cabral - s/n\r\nSAO PAULO, SP",
				"label" : "endere\u00e7o"
			},
			{
				"key" : "passSourceClone",
				"label" : "mais informa\u00e7\u00f5es em",
				"value" : "https://www.ingresse.com.br/ingressos-holi-festival-das-cores"
			}
		]
	},
	"serialNumber" : "54725e72ad30b",
	"description" : "HOLI FESTIVAL DAS CORES ticket",
	"formatVersion" : 1,
	"organizationName" : "Ingresse",
	"passTypeIdentifier" : "pass.com.ingresse.ticket",
	"teamIdentifier" : "KA3BZ23AM2"
};

var tempPath = "./temp/";

app.get('/', function (req, res) {

	passkit.createPass(certificates, imageFiles, template, 'pass',tempPath);

	res.send('Hello World!');
});

var server = app.listen(3000, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)

});