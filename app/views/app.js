module.exports = function (app, options) {

	var middleware = require("../middleware");
	var logger = require("log4js").getLogger("view/app.js");
	var fs = require("fs");
	var nconf = require("nconf");


	app.get('/:file(*)', function (req, res) {
		var sharedDirectory = nconf.get("shared-link-directory-name");
		var requestedDirectory = sharedDirectory;
		logger.info("request: " + req.params.file);
		if (req.params.file){
			requestedDirectory = (sharedDirectory + "/" + req.params.file);
		}
		var files = fs.readdirSync(requestedDirectory);
		
		var viewFiles = [];
		files.forEach(function(file){
			var relativePathFile = requestedDirectory+'/'+file;
			var viewRelativePathFile = '/';

			var stats = fs.statSync(relativePathFile);
			
			if (req.params.file !== ""){
				viewRelativePathFile += req.params.file + file;
			}else{
				viewRelativePathFile += file;
			}

			if (stats.isDirectory()){
				viewRelativePathFile += '/';
			}
			
			viewFiles.push({filename: file, isDirectory: stats.isDirectory(), path: viewRelativePathFile});
		});
    	middleware.render('app', req, res, {files: viewFiles});
    });
};