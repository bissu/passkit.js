var express = require('express');
var passkit = require('./passkit.js');
var ingresse = require('./ingresse-sdk.js');
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
	'./images/logo.png',
	'./images/thumbnail.png',
	'./images/thumbnail@2x.png'
];

var template = {
	"barcode" : {
		"message" : "25.1137.Q009706R.707655.06",
		"format" : "PKBarcodeFormatQR",
		"messageEncoding" : "iso-8859-1",
		"altText" : ""
	},
//	"foregroundColor" : "rgb(255, 255, 255)",
//	"labelColor" : "rgb(255, 255, 255)",
	"backgroundColor" : "rgb(255, 255, 255)",
	"eventTicket" : {
		"headerFields" : [
			{
				"key" : "day",
				"label" : "DATA",
				"value" : "02/12",
				"textAlignment" : "PKTextAlignmentRight",
				"changeMessage" : "Changed to %@"
			}
		],
		"primaryFields" : [{
			"key" : "event",
			"label" : "EVENTO",
			"value" : "HOLI FESTIVAL DAS CORES",
			"textAlignment" : "PKTextAlignmentNatural",
			"changeMessage" : "Changed to %@"
		}],
		"secondaryFields" : [{
			"key" : "tktType",
			"label" : "TIPO INGRESSO",
			"value" : "Parque do Ibirapuera",
			"textAlignment" : "PKTextAlignmentNatural",
			"changeMessage" : "Changed to %@"
		}],
		"auxiliaryFields" : [{
			"key" : "location",
			"label" : "LOCAL",
			"value" : "Parque do Ibirapuera",
			"textAlignment" : "PKTextAlignmentNatural",
			"changeMessage" : "Changed to %@"
		}],
		"backFields" : [
			{
				"key" : "owner",
				"label" : "Dono do ingresso",
				"value" : "Rodrigo Maués"
			},
			{
				"key" : "address",
				"value" : "Parque do Ibirapuera\r\nAv. Pedro Álvares Cabral - s/n\r\nSAO PAULO, SP",
				"label" : "Endereço"
			},
			{
				"key" : "contact",
				"label" : "Contato",
				"value" : "Ao precisar de ajuda, entre em contato através do email contato@ingresse.com."
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


	// GET USER TICKETS FOR SPECIFIED EVENT
	var params = {
		event : req.query.eventid
	};
	// usertoken = '118-03af038deec1cffe39a818b5932a43aee777cccb'
	// saleticketid = 778985
	ingresse.request('user', req.query.userid, 'tickets', params, req.query.usertoken, function(data){

		// SELECT TICKET FROM LIST
		for (var i = 0; i < data.responseData.length; i++) {
			if(data.responseData[i].saleTicketId == req.query.saleticketid) {

				ingresse.request('event', data.responseData[i].eventId, '', null, '', function(event) {

					console.log(event);

					template.barcode.message = data.responseData[i].code;                                                                   // QR Code
					template.eventTicket.headerFields[0].value = data.responseData[i].eventDate.date.substr(0,5);                           // Event Day & Month
					template.eventTicket.primaryFields[0].value = data.responseData[i].eventTitle;                                          // Event Name
					if (data.responseData[i].seatLocator ) {
						template.eventTicket.secondaryFields[0].label = data.responseData[i].ticketType + " " + data.responseData[i].type;    // Ticket Type & Guest Type
						template.eventTicket.secondaryFields[0].value = data.responseData[i].seatLocator;                                     // Seat
					} else {
						template.eventTicket.secondaryFields[0].label = data.responseData[i].type;                                            // Ticket Type & Guest Type
						template.eventTicket.secondaryFields[0].value = data.responseData[i].ticketType;                                      // Guest Type
					}
					template.eventTicket.backFields[0].value = data.responseData[i].guestName + "\r\n" + data.responseData[i].guestEmail;   // Ticket Guest Name and Email
					passkit.createPass(certificates, imageFiles, template, 'pass', tempPath);

				});
			}
		}
	});

	res.send('Hello World! ' + req.query.usertoken);
});

var server = app.listen(3000, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)

});