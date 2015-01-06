var fs = require('fs');
var crypto = require('crypto');
var AdmZip = require('adm-zip');
var exec = require('child_process').exec;
var async = require('async');

module.exports = {

	"createPass" : function(certificates, imageFiles, template, passName, tempPath, returnPassbookPath) {

		// Define pathes
		var uniquePassId  = Date.now() + Math.random();
		var manifestPath  = tempPath + uniquePassId + '/manifest.json';
		var templatePath  = tempPath + uniquePassId + '/pass.json';
		var signaturePath = tempPath + uniquePassId + '/signature';
		var PKPassPath    = tempPath + uniquePassId + '/' + passName + '.pkpass';

		function createZipPass() {
			// Put files (and strings as files) in a zip archive
			var zipFile = new AdmZip();
			zipFile.addLocalFile(signaturePath);
			zipFile.addLocalFile(manifestPath);
			zipFile.addLocalFile(templatePath);

			// Removing pass.json file
			imageFiles.pop();

			// Adding files into zip file
			imageFiles.forEach(function(element){
				zipFile.addLocalFile(element);
			});

			zipFile.writeZip(PKPassPath);

			returnPassbookPath(PKPassPath);
		}

		function createSignature(certificates, manifestPath, signaturePath) {
			var cmdString = 'openssl smime -binary -sign -certfile ' + certificates.appleWWDRCA + ' -signer ' + certificates.passCertificate + ' -inkey ' + certificates.passKey + ' -in ' + manifestPath + ' -out ' + signaturePath + ' -outform DER -passin pass:PatatiPatata2014';
			exec(cmdString,createZipPass);
		}

		function creatingManifest(manifest, manifestFiles, callback) {

			var asyncTasks = [];

			// Loop through some items
			manifestFiles.forEach(function(item){
				asyncTasks.push(function(callback){
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
		});
	}
};