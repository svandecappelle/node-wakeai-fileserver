/*jslint node: true */
'use strict';

var async = require('async'),
    nconf = require('nconf'),
    logger = require('log4js').getLogger("User:create"),
    user = require('./../user'),
    utils = require('./../../utils'),
    db = require('./../database'),
    groups = require('../groups'),
    emailer = require('./../emailer');

module.exports = function (User) {
    User.emails = function (username, callback) {
        this.exists(username, function (err, exists) {
            if (!exists) {
                logger.error("User: " + username + " does not exist");
                return callback("Does not exists username");
            }
            db.getObject('emails:' + username, function (err, obj) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, obj);
                }
            });
        });
    };

    User.removeEmail = function (username, account, callback) {
        this.exists(username, function (err, exists) {
            if (!exists) {
                logger.error("User: " + username + " does not exist");
                return callback("Does not exists username");
            }

            db.deleteObjectField('ssh:' + username, account.title, function (err, obj) {
                if (err) {
                    callback(err, null);
                } else {
                    db.decrObjectField('global', 'emails_count');
                    callback(null, obj);
                }
            });

        });
    };

    User.addEmail = function (username, account, callback) {
        this.exists(username, function (err, exists) {
            if (!exists) {
                logger.error("User: " + username + " does not exist");
                return callback("Does not exists username");
            }

            db.setObjectField('ssh:' + username, account.title, account.email, function (err, obj) {
                if (err) {
                    callback(err, null);
                } else {
                    db.incrObjectField('global', 'emails_count');
                    callback(null, obj);
                }
            });
        });
    };
    User.emails = {};

    User.emails.count = function (callback) {
        db.getObjectField('global', 'emails_count', callback);
    };
};
