var nconf = require("nconf"),
  socketio = require('socket.io'),
  logger = require('log4js').getLogger('Server'),
  async = require("async");

var routes = require('./routes');


(function(Application) {
	Application.load = function (app, callback) {
		routes.load(app);
		this.app = app;
		served = this.app.listen(nconf.get('port'));
		this.io = socketio(served);
		var urlService = "http://".concat(nconf.get("hostname")).concat(":").concat(nconf.get("port"));
		logger.info("Service is ready and listening on: " + urlService);
		if (callback){
			callback(urlService);
		}
	};

	Application.on = function(event, callback){
		this.io.on(event, callback);
	};

	Application.emit = function(event, params){
		this.io.emit(event, params);
	};

	Application.start = function (){
		var that = this;
		logger.info("Ready to serve on " + nconf.get('port') + " port");
		that.on('connection', function(socket){
			logger.debug("User connected to socket.io");
		});
	};
})(exports);
