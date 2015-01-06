var express = require('express');
var passkit = require('./passkit.js');
var ingresse = require('./ingresse-sdk.js');
var app = express();
var async = require('async');

var certificates = {
	"appleWWDRCA" : "./certs/AppleWWDRCA.pem",
	"passCertificate" : "./certs/passcertificate.pem",
	"passKey" : "./certs/passkey.pem",
	"certPassword" : ""
};

var imageFiles = [
	'./images/icon@2x.png',
	'./images/logo@2x.png',
	'./images/icon.png',
	'./images/logo.png'
];

var template = {
	"barcode" : {
		"message" : "25.1137.Q009706R.707655.06",
		"format" : "PKBarcodeFormatQR",
		"messageEncoding" : "iso-8859-1",
		"altText" : ""
	},
	"foregroundColor" : "rgb(255, 255, 255)",
	"labelColor" : "rgb(255, 255, 255)",
	"backgroundColor" : "rgb(0, 121, 166)",
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
	"description" : "Ingresso para o evento ",
	"formatVersion" : 1,
	"organizationName" : "Ingresse",
	"passTypeIdentifier" : "pass.com.ingresse.ticket",
	"teamIdentifier" : "KA3BZ23AM2",
	"associatedStoreIdentifiers" : [815359760],
	"locations" : [
		{
			"latitude" : "",
			"longitude" : ""
		}
	]
};

var tempPath = "/Users/bissuh/Development/passkit.js/temp/";

app.get('/', function (req, res) {

	var asyncTasks = [];

	//
	// GET TICKETS LIST FROM USER
	//
	asyncTasks.push(function(callback){
		// usertoken = '118-03af038deec1cffe39a818b5932a43aee777cccb'
		// saleticketid = 778985

		// USING FILTER PARAM TO GET USER TICKETS FOR SPECIFIC EVENT
		var params = {
			event : req.query.eventid
		};

		ingresse.request('user', req.query.userid, 'tickets', params, req.query.usertoken, function(data){
			callback(null, data);
		});
	});

	//
	// GET EVENT DATA
	//
	asyncTasks.push(function(callback){
		ingresse.request('event', req.query.eventid, '', null, req.query.usertoken, function(data){
			callback(null, data);
		});
	});

	//
	// RUN ASYNC TASKS IN PARALLEL
	//
	async.parallel(asyncTasks, function(err, results){
		if (!err) {

			// SPLIT RESULT VALUES INTO SPECIFIC VARIABLES
			var ticketsList = results[0];         // Event tickets list
			var event = results[1].responseData;  // Event data

			// SELECT TICKET FROM LIST
			var selectedTicket;
			for (var i = 0; i < ticketsList.responseData.length; i++) {
				if(ticketsList.responseData[i].saleTicketId == req.query.saleticketid) selectedTicket = ticketsList.responseData[i];
			}

			// VERIFYING IF THERE IS A SELECTED TICKET
			if(!selectedTicket) return 0;

			// UPDATING PASSBOOK TEMPLATE DATA
			template.serialNumber = selectedTicket.saleticketid;                                                              // Sale Ticket ID as Serial Number
			template.groupingIdentifier = event.id;                                                                           // Event ID as group identifier
			template.description = template.description + selectedTicket.eventTitle;                                          // Passbook description
			template.barcode.message = selectedTicket.code;                                                                   // QR Code
			template.voided = selectedTicket.checked;                                                                         // Expires the ticket if already used
			template.eventTicket.headerFields[0].value = selectedTicket.eventDate.date.substr(0,5);                           // Event Day & Month
			template.eventTicket.primaryFields[0].value = selectedTicket.eventTitle;                                          // Event Name
			if (selectedTicket.seatLocator ) {
				template.eventTicket.secondaryFields[0].label = selectedTicket.ticketType + " " + selectedTicket.type;          // Ticket Type & Guest Type
				template.eventTicket.secondaryFields[0].value = selectedTicket.seatLocator;                                     // Seat
			} else {
				template.eventTicket.secondaryFields[0].label = selectedTicket.type;                                            // Ticket Type & Guest Type
				template.eventTicket.secondaryFields[0].value = selectedTicket.ticketType;                                      // Guest Type
			}
			template.eventTicket.backFields[0].value = selectedTicket.guestName + "\r\n" + selectedTicket.guestEmail;         // Ticket Guest Name and Email
			template.eventTicket.auxiliaryFields[0].value = event.venue.name + " - " + event.venue.street;                    // Event address
			template.eventTicket.backFields[1].value = event.venue.name + "\r\n"                                              // Complete event address in back fields
																									+ event.venue.street + "\r\n"
																									+ event.venue.crossStreet + "\r\n"
																									+ event.venue.complement + "\r\n"
																									+ event.venue.city + " - " + event.venue.state;

			// TODO Pedir ao pessoal da API para adicionar timestamp no formato W3C no ingresso
			//template.relevantDate = selectedTicket.eventDate.date.substr(6,4) + "-" + selectedTicket.eventDate.date.substr(3,2) + "-" + selectedTicket.eventDate.date.substr(0,2) + "T" + selectedTicket.eventDate.time ;
			//template.expirationDate =
			template.locations[0].latitude = event.venue.location[0];
			template.locations[0].longitude = event.venue.location[1];

			// GENERATING THE PASS
			passkit.createPass(certificates, imageFiles, template, 'pass', tempPath, function(filePath){
				res.set('Content-Type','application/vnd.apple.pkpass');
				res.sendFile(filePath);
			});
		}
	});

});

var server = app.listen(80, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port)

});