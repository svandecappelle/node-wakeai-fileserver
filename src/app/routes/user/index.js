var logger = require('log4js').getLogger("AdministratorsRoutes"),
    nconf = require("nconf"),
    fs = require("fs"),
    async = require('async'),
    _ = require("underscore"),
    path = require('path'),
    serveStatic = require('serve-static');
    middleware = require("./../../middleware"),
    meta = require("./../../meta"),
    user = require("./../../model/user"),
    mailer = require("./../../emailer");


(function(UsersRoutes) {

    UsersRoutes.api = function(app){

    };

    UsersRoutes.routes = function (app){

        var localSharedFolder = path.resolve(".", nconf.get("shared-link-directory-name"));
        var distantSharedFolder = nconf.get("shared-folder");
        logger.info(localSharedFolder);
        if (!fs.existsSync(localSharedFolder)){

            fs.symlinkSync(distantSharedFolder, localSharedFolder, 'dir');
            logger.info("Linked folder created");
        }else{
            logger.info("Linked folder already exists");
        }
        app.use('/files', serveStatic(localSharedFolder, {dotfiles: 'allow'}));
        app.get('/', function (req, res) {
            res.redirect('/files');
        });
        app.get('/files/:file(*)', function (req, res) {
            logger.info("Client access to index [" + req.ip + "]");


            var sharedDirectory = nconf.get("shared-folder");
            var requestedDirectory = sharedDirectory;
            logger.info("request: " + req.params.file);
            if (req.params.file){
                requestedDirectory = (sharedDirectory + "/" + req.params.file);
            }
            if(fs.existsSync(requestedDirectory)) {
                var files = fs.readdirSync(requestedDirectory);

                var viewFiles = [];
                files.forEach(function(file){
                    if (!nconf.get("show-hidden-file")){
                        if (file.indexOf(".") === 0){
                            return;
                        }
                    }
                    var relativePathFile = requestedDirectory+'/'+file;
                    var viewRelativePathFile = '';
                    var fileSize;

                    var stats = fs.statSync(relativePathFile);

                    if (req.params.file !== ""){
                        viewRelativePathFile += './' + file;
                    }else{
                        viewRelativePathFile += './' +file;
                    }

                    if (stats.isDirectory()){
                        viewRelativePathFile += '/';
                    } else {
                        var tmplength = stats.size;
                        var type = " bytes";
                        if (Math.floor(tmplength / 1024) > 0) {
                            tmplength = tmplength / 1024;
                            type = "kb";
                            if (Math.floor(tmplength / 1024) > 0) {
                                tmplength = tmplength / 1024;
                                type = "Mb";
                                if (Math.floor(tmplength / 1024) > 0) {
                                    tmplength = tmplength / 1024;
                                    type = "Gb";
                                }
                            }
                        }
                        fileSize = Math.round(tmplength*100)/100 + type;
                    }
                    viewFiles.push({filename: file, isDirectory: stats.isDirectory(), path: viewRelativePathFile, size: fileSize});
                });

                middleware.whenAuthenticated('index', req, res, {isRoot: !req.params.file, files: viewFiles});

            } else {
                middleware.whenAuthenticated('404', req, res);
            }
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

        app.get("/user/:username/avatar", function (req, res){
            var username = req.params.username,
                avatar = username + "/avatar";

            res.setHeader("Pragma-directive", "no-cache");
            res.setHeader("Cache-directive", "no-cache");
            res.setHeader("Cache-control", "no-cache");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");

            if (middleware.hasAvatar(username)) {
                res.sendFile(avatar, userFilesOpts);
            } else {
                res.redirect(middleware.getAvatar(username));
            }
        });

        app.get("/user/:username/background", function (req, res){
            res.setHeader("Pragma-directive", "no-cache");
            res.setHeader("Cache-directive", "no-cache");
            res.setHeader("Cache-control", "no-cache");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");

            var username = req.params.username,
                background = username + "/background";
            if (!middleware.hasImageFile(username, "background")){
                background = "background.jpg";
            }

            res.sendFile(background, userFilesOpts);
        });

        app.get("/user/:username/cover", function (req, res){
            res.setHeader("Pragma-directive", "no-cache");
            res.setHeader("Cache-directive", "no-cache");
            res.setHeader("Cache-control", "no-cache");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");

            var username = req.params.username,
                cover = username + "/cover";
            if (middleware.hasCover(username)) {
                res.sendFile(cover, userFilesOpts);
            } else {
                res.redirect(cover);
            }
        });
    };

    UsersRoutes.load = function (app) {
        this.api(app);
        this.routes(app);
    };
})(exports);
