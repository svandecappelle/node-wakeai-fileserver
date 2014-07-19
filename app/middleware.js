/*jslint node: true */
"use strict";

var middleware = {},
	async = require('async'),
	nconf = require('nconf'),
	fs = require('fs'),
	logger = require('log4js').getLogger("Middleware");

/*
	Render a view. Control if rights are valid to access the view and if user is authenticated (if needed).
 */
middleware.render = function(view, req, res, objs){
	
	/*if (this.requireAuthentication(view, req)){
		// need an auth
		req.session.redirectTo = req.originalUrl;
		res.send(req.session);
		return this.redirect('/login', res);
	}else if(this.requireMorePrivilege(req, res, view) && view !== '403'){
		// need more privilege
		return this.redirect('/403', res);
	}else{*/
		var viewParams = objs;
		if (viewParams === undefined){
			viewParams = {};
		}
		var middlewareObject = {
			req: req,
			res: res,
			view: view,
			objs: viewParams
		};

		var call = async.compose(this.session, this.meta);

		call(middlewareObject, function(err, middlewareObject){
			res.render(view, middlewareObject.objs);
		});
		
	//}
};

/*
	Add session objs in view params
 */
middleware.session = function(middlewareObject, next){

	if (middlewareObject.req.isAuthenticated()){
		middlewareObject.objs.isAnonymous = false;
		next(null, middlewareObject);
	}else{
		next(null, middlewareObject);
	}
	

};

/*
	Add meta config of user in view params
 */
middleware.meta = function(middlewareObject, next){
	middlewareObject.objs.meta = {
		nav: {
			separated: false
		}
	};
	next(null, middlewareObject);
};


/*
	Post a method (test if user is authenticated)
 */
middleware.post = function(req, res, callback){
	if (!req.isAuthenticated()){
		res.send('403', 'You need to be logged');
	}else{
		callback();
	}
};

/*
	Get a response (test if user is authenticated)
 */
middleware.get = function(req, res, callback){
	if (!req.isAuthenticated()){
		req.session.redirectTo = req.originalUrl;
		res.send(req.session);
		this.redirect('/login', res);
	}else{
		callback();
	}
};

/*
	Send redirect to client.
 */
middleware.redirect = function(view, res){
	res.redirect(view);
};

/*
	Render internal error.
 */
middleware.error = function(req, res, error){
	logger.error("Redirect on error view: " + error);
	middleware.render("500", req, res, {error: {message: error}});
};

module.exports = middleware;