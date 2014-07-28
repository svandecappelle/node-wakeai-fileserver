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
			var fileSize;

			var stats = fs.statSync(relativePathFile);
			
			if (req.params.file !== ""){
				viewRelativePathFile += req.params.file + file;
			}else{
				viewRelativePathFile += file;
			}

			if (stats.isDirectory()){
				viewRelativePathFile += '/';
			}

			// Format file size
			if(stats.size) {
				var tmplength = stats.size;
				var dec = 0;
				var type = " bytes";
				var floor = Math.floor(tmplength / 1000);
				if (floor > 0) {
					dec = (tmplength % 1000);
					tmplength = floor;
					type = "kb";
					floor = Math.floor(tmplength / 1000);
					if (floor > 0) {
						dec = (tmplength % 1000);
						tmplength = floor;
						type = "Mb";
						floor = Math.floor(tmplength / 1000);
						if (floor > 0) {
							dec = (tmplength % 1000);
							tmplength = floor;
							type = "Gb";
						}
					}
				}
				if(dec > 0) {
					fileSize =  tmplength + ("," + dec).substring(0,3) + type;
				} else {
					fileSize =  tmplength + type;
				}
				
			}
			
			viewFiles.push({filename: file, isDirectory: stats.isDirectory(), path: viewRelativePathFile, size: fileSize});
		});
    	middleware.render('app', req, res, {files: viewFiles});
    });

    app.post("/:file(*)", function (req, res){
    	/*
		var async, handler, streamingResponse;

		streamingResponse = require("./streaming-zip");

		async = require("async");

		console.log(streamingResponse);

		handler = function(req, res) {
			var files, streaming;
			files = [
				{
					source: "./shared/test.py",
					destination: "test.py"
				}, {
					source: "./shared/Téléchargements/ZU-1612158.pdf",
					destination: "jean/tuto.pdf"
				}
			];
			streaming = streamingResponse.init({
				filename: "my_download.zip",
				files: files
			});
			
			return streaming.pipe(res, (function(_this) {
				return function(err) {
					if (err) {
						logger.error(err);
					}
					logger.info("Finished!");
					return res.end();
				};
			})(this));
		};
		handler(req, res);*/
    });
};