var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var forge = require('node-forge');
var AdmZip = require('adm-zip');
var atob = require('atob');
var exec = require('child_process').exec;
var async = require('async');

module.exports = {

	"createPass" : function(certificates, imageFiles, template, passName, tempPath, debug) {

		// Define pathes
		var uniquePassId  = Date.now() + Math.random();
		var manifestPath  = tempPath + uniquePassId + '/manifest.json';
		var templatePath  = tempPath + uniquePassId + '/pass.json';
		var signaturePath = tempPath + uniquePassId + '/signature';
		//var PKCS7Path = tempPath + uniquePassId + '/cert.p7b';
		var PKPassPath    = tempPath + uniquePassId + '/' + passName + '.pkpass';


		//function PEM2DER(signature) {
		//	var strpos = signature.indexOf('filename="smime.p7s"')+20;
		//	var newSignature = signature.substr(strpos);
		//	var strposCleanTraces = signature.indexOf('------');
		//	newSignature.substr(0, strposCleanTraces);
		//
		//	return atob(newSignature.trim());
		//
		//	//signature = substr(signature, (strpos(signature, 'filename="smime.p7s"')+20));
		//	//return base64_decode(trim(substr($signature, 0, strpos($signature, '------'))));
		//}

		function createZipPass() {
			// Put files (and strings as files) in a zip archive
			var zipFile = new AdmZip();
			zipFile.addLocalFile(signaturePath);
			zipFile.addLocalFile(manifestPath);
			zipFile.addLocalFile(templatePath);

			var asyncTasks = [];

			imageFiles.pop();
			//imageFiles.forEach(function (element) {
			//	asyncTasks.push(function() {
			//		zipFile.addLocalFile(element);
			//		callback();
			//	});
			//});
			imageFiles.forEach(function(element){
				zipFile.addLocalFile(element);
			});

			setTimeout(zipFile.writeZip(PKPassPath),2000);
		}

		function createSignature(certificates, manifestPath, signaturePath) {
			var cmdString = 'openssl smime -binary -sign -certfile ' + certificates.appleWWDRCA + ' -signer ' + certificates.passCertificate + ' -inkey ' + certificates.passKey + ' -in ' + manifestPath + ' -out ' + signaturePath + ' -outform DER -passin pass:PatatiPatata2014';
			exec(cmdString,createZipPass);
		}

		function creatingManifest(manifest, manifestFiles, callback) {

			var asyncTasks = [];

			// Loop through some items
			manifestFiles.forEach(function(item){
				// We don't actually execute the async action here
				// We add a function containing it to an array of "tasks"
				asyncTasks.push(function(callback){
					// Call an async function, often a save() to DB
					// Async call is done, alert via callback
					var shasum = crypto.createHash('sha1');

					var s = fs.ReadStream(item);
					s.on('data', function(d) {
						shasum.update(d);
					});

					s.on('end', function() {
						var d = shasum.digest('hex');
						callback(null, d);
					});
				});
			});

			async.parallel(asyncTasks, function(err, results) {
				// Save JSON hashes in temp
				fs.writeFile(manifest, JSON.stringify(results, null, 4), callback(certificates, manifestPath, signaturePath));
			});
		}

		// Create temp directory
		fs.mkdirSync(tempPath + uniquePassId);

		// Save pass.json file
		fs.writeFile(templatePath, JSON.stringify(template, null, 4), function() {

			// Add pass.json into imageFiles Array for manifest creation
			imageFiles.push(templatePath);

			// Generating SHA1 hashes
			creatingManifest(manifestPath, imageFiles, createSignature);

			//var md = forge.md.sha1.create();
			//md.update(fs.readFile(templatePath));
			//var fileHashes = {
			//	"pass.json" : md.digest().toHex()
			//};

			//var cmdString = 'openssl smime -binary -sign -certfile ' + certificates.appleWWDRCA + ' -signer ' + certificates.passCertificate + ' -inkey ' + certificates.passKey + ' -in ' + ManifestPath + ' -out ' + SignaturePath + ' -outform DER -passin pass:PatatiPatata2014';
			//
			//exec(cmdString,
			//	function (error, stdout, stderr) {
			//		if (error !== null) {
			//			console.log('exec error: ' + error);
			//		} else {
			//			// Put files (and strings as files) in a zip archive
			//			var zipFile = new AdmZip();
			//			zipFile.addLocalFile(SignaturePath);
			//			zipFile.addLocalFile(ManifestPath);
			//			zipFile.addFile('pass.json', new Buffer(template));
			//			imageFiles.forEach(function (element) {
			//				zipFile.addLocalFile(element);
			//			});
			//			setTimeout(zipFile.writeZip(PKPassPath),2000);
			//		}
			//	});

		});


		/*******

		// Create Signature file
		var p7 = forge.pkcs7.createSignedData();
		p7.addCertificate(fs.readFileSync(certificates.appleWWDRCA, {encoding: 'utf8'}));
		p7.addCertificate(fs.readFileSync(certificates.certificate, {encoding: 'utf8'}));
		var pem = forge.pkcs7.messageToPem(p7);
		var ManifestSignatureDER = PEM2DER(pem);


		// Load Pass data
		var pass = {};
		pass.data = fs.readFileSync(PKPassPath);
		pass.name = passName;

		return pass;


		//console.log(manifestSignatureDER);

		 *****/
	}
};