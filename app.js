var application_root = __dirname,
        express = require('express'),
        path = require('path'),
        http = require('http');
log4js = require("log4js");
var app = express();

var fs = require('fs'),
    os = require('os'),
    logger = require('log4js').getLogger('Server'),
    path = require('path'),
    pkg = require('./package.json');

var nconf = require('nconf');
nconf.argv().env();

// Alternate configuration file support
var configFile = __dirname + '/config.json',
    configExists;
if (nconf.get('config')) {
    configFile = path.resolve(__dirname, nconf.get('config'));
}
configExists = fs.existsSync(configFile);

start();

function loadConfig() {
    nconf.file({
        file: configFile
    });

    nconf.defaults({
        base_dir: __dirname,
        upload_url: '/uploads/'
    });
}

function start(){

    // LOADING CONFIGURATION FILE
    loadConfig();

    var bodyParser = require('body-parser');
    var session = require('express-session');
    var cookieParser = require('cookie-parser');
    var passport = require('passport');
    var serveStatic = require('serve-static');

    // public PATHS
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/app/public'));
    app.use(bodyParser());
    app.use(cookieParser()); // required before session.
    app.use(session({
        secret: 'keyboard cat',
        proxy: true // if you do SSL outside of node.
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    var middleware = require("./app/middleware");


    var sharedFolder = nconf.get("shared-folder");
    if (!fs.existsSync(nconf.get("shared-link-directory-name"))){
        fs.symlinkSync(sharedFolder, path.resolve(__dirname,nconf.get("shared-link-directory-name")));
        logger.info("Linked folder created");
    }else{
        logger.info("Linked folder already exists");
    }
    app.use(serveStatic(__dirname + '/' + nconf.get("shared-link-directory-name"), {hidden: true}));

    require("./app/views/app")(app);

    app.use(function(req, res, next){
        res.status(404);

        // respond with html page
        if (req.accepts('html')) {
            middleware.render('404', req, res, { url: req.url });
        return;
        }

        // respond with json
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
        return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');
    });



    app.use(function(err, req, res, next) {
        console.log(err);
        if (err.status === 404) {
            middleware.render('404', req, res, { status: 404 });
        } else {
            middleware.render('500', req, res, { error: {status: 500, message: "Erreur interne: " + err, stack: err.stack}});
        }
    });

    // LISTEN PORT APP
    var served = app.listen(nconf.get('port'));

    logger.info("Ready to serve on " + nconf.get('port') + " port");

}