/*jslint node: true */
(function (Middleware) {
    "use strict";

    var middleware = {},
        async = require('async'),
        nconf = require('nconf'),
        fs = require('fs'),
        _ = require("underscore"),
        path = require("path"),
        logger = require('log4js').getLogger("Middleware"),
        meta = require("./../meta"),
        gravatar = require("gravatar"),
        identicon;

    try {
        identicon = require('identicon');
    } catch (expect) {
        logger.warn("Not installed optional extension: identicon it will not be used.");
    }

    Middleware.authenticate = function (req, res, callback) {
      if (this.isAuthenticated(req)) {
        callback();
      } else {
        logger.warn("Anonymous access forbidden: authentication required.");
        this.redirect('/login', res);
      }
    };

    Middleware.whenAuthenticated = function(view, req, res, params){
        this.render(view, req, res, {authenticate: true}, params);
    };

    /*
     * Render a view. Control if rights are valid to access the view and if user is authenticated (if needed).
     */
    Middleware.render = function (view, req, res, options, params) {
        var viewParams = params,
            httpResponse = {
                req: req,
                res: res,
                view: view,
                params: viewParams
            },
            call = async.compose(this.session, this.meta);

        if (viewParams === undefined) {
            viewParams = {};
        }

        if (httpResponse.params === undefined) {
            httpResponse.params = {};
        }

        if (httpResponse.params.session === undefined) {
            httpResponse.params.session = {};
        }

        var rendering = function (){
            call(httpResponse, function (err, httpResponse) {
                logger.debug(httpResponse.params.session);
                res.render(view, httpResponse.params);
            });
        };

        if (options && options.authenticate){
            this.authenticate(req, res, rendering);
        } else {
            rendering();
        }

    };

    Middleware.json = function (req, res, json) {
        res.json(json);
    };

    /*
     * Send redirect to client.
     */
    Middleware.redirect = function (view, res) {
        res.redirect(view);
    };

    /*
     * Add session objs in view params
     */
    Middleware.session = function (httpResponse, next) {
        logger.debug(httpResponse.params);

        var urlServer = null;

        if (httpResponse.req.headers.host.lastIndexOf(":" + nconf.get("port")) != -1){
            urlServer = httpResponse.req.headers.host.substring(0, httpResponse.req.headers.host.length - (nconf.get("port").length + 1));
        } else {
            urlServer = httpResponse.req.headers.host;
        }

        var serverConfig = {
            serverurl: urlServer,
            serverport: nconf.get("port")
        };

        // that's ok
        if (httpResponse.params === undefined) {
            httpResponse.params = {
                session: {}
            };
        } else if (httpResponse.params.session === undefined) {
            httpResponse.params.session = {};
        }

        _.extend(httpResponse.params, serverConfig);
        httpResponse.params.session.user = {
            isAnonymous: true,
        };

        if (httpResponse.req.session.chats === undefined) {
            httpResponse.req.session.chats = [];
        }
        httpResponse.params.session.chats = httpResponse.req.session.chats;

        httpResponse.params.session.notifications = {
            count: 1,
            datas: ["Application is still in beta access."]
        };

        // config
        httpResponse.params.meta = {
            requireAuthentication: false
        };

        meta.settings.getOne("global", "requireLogin", function (err, curValue) {
            if (err) {
                logger.debug("userauth error checking");
            } else if (curValue === "true") {
                httpResponse.params.meta.requireAuthentication = true;
            }

            if (httpResponse.req.isAuthenticated()) {
                httpResponse.params.session.user = httpResponse.req.user;

                httpResponse.params.session.user.avatar = Middleware.getAvatar(httpResponse.req.user.username);
                httpResponse.params.session.user.isAnonymous = false;

                // Retrieve role type
                next(null, httpResponse);
            } else {
                logger.debug("return middleware: " + httpResponse);
                next(null, httpResponse);
            }
        });

        httpResponse.params.session.hostname = nconf.get("hostname");
        httpResponse.params.session.host = nconf.get("hostname").concat(":").concat(nconf.get("port"));
    };

    /**
    * Checking user file served or not depending of the file type [cover/avatar...].
    */
    Middleware.hasImageFile = function (username, type){
      var imageDirectory = __dirname + "/../../../users/",
          imageFile = imageDirectory + username + "/" + type;
      if (!fs.existsSync(imageDirectory)) {
          fs.mkdirSync(imageDirectory);
          logger.info("folder user not exists. Create one.");
      }
      return fs.existsSync(imageFile);
    };

    /**
    * Check if user has a served avatar.
    */
    Middleware.hasAvatar = function (username){
      return this.hasImageFile(username, "avatar");
    };
    /**
    * Check if user has a served cover.
    */
    Middleware.hasCover = function (username){
      return this.hasImageFile(username, "cover");
    };

    /**
    * Get generic file location depending of the type.
    */
    Middleware.getImageFile = function (username, type){
      var urlUser = null;

      if (this.hasImageFile(username, type)){
        var imageDirectory = __dirname + "/../../../users/",
            imageFile = imageDirectory + username + "/" + type;
        urlUser = path.resolve(imageFile);
      }
      return urlUser;
    };

    /**
    * Get the avatar file location of a user for serving.
    */
    Middleware.getAvatar = function (username) {
      var urlUser = this.getImageFile(username, "avatar");
      var imageDirectory = __dirname + "/../../../users/",
          imageFile = imageDirectory + username + "/avatar";
      if (urlUser === null){
        if (!nconf.get("gravatar")) {
          if (identicon) {
              identicon.generate(username, 150, function (err, buffer) {
                  if (err) {
                      throw err;
                  }

                  fs.writeFileSync(imageFile, buffer);
              });
              urlUser = path.resolve(imageFile);
          }
        } else {
            urlUser = gravatar.url(username, {s: '200', r: 'pg', d: 'identicon'});
        }
      }
      return urlUser;
    };

    /**
    * Get the cover file of a user.
    */
    Middleware.getCover = function (username) {
      return this.getImageFile(username, "cover");
    };

    /*
     * Add meta config of user in view params
     */
    Middleware.meta = function (httpResponse, next) {
        if (httpResponse.params !== undefined) {
            httpResponse.params.meta = {};
        } else {
            httpResponse.params = {
                meta: {}
            };
        }
        next(null, httpResponse);
    };

    /*
     * Post a method (test if user is authenticated)
     */
    Middleware.post = function (req, res, callback) {
        if (!req.isAuthenticated()) {
            res.send('403', 'You need to be logged');
        } else {
            callback();
        }
    };

    Middleware.requireAuthentication = function (req) {
        return false;
        //return !req.isAuthenticated();
    };

    Middleware.isAuthenticated = function (req) {
        return req.isAuthenticated();
    };


}(exports));
