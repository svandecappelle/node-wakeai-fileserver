  var async, fs, zipstream,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  var StreamingResponse = {};
  zipstream = require("zipstream");

  fs = require("fs");

  async = require("async");

  StreamingResponse.init = function (options) {
    this.addFilesToZip = __bind(this.addFilesToZip, this);
    this._addFile = __bind(this._addFile, this);
    this.filename = options.filename || "download.zip";
    this.files = options.files;
    return this;
  };

  StreamingResponse.filename = "";

  StreamingResponse.files = [];

  StreamingResponse.streaming = true;


  /*
  Takes an options parameter like this:
  
  options =
    filename: "download.zip"
    files: [
      {
        source: "/var/www/file.jpg"
        destination: "/event/file.jpg"
      }
    ]
   */


  StreamingResponse.setHeaders = function(stream) {
    stream.contentType("zip");
    return stream.setHeader("Content-Disposition", "attachment; filename=" + this.filename);
  };

  StreamingResponse._addFile = function(file, cb) {
    var readStream;
    if (!this.streaming) {
      console.log("Stopped streaming");
      this.zip.destroy();
      return cb("Stopped streaming");
    }
    readStream = fs.createReadStream(file.source);
    return this.zip.addFile(readStream, {
      name: file.destination
    }, cb);
  };

  StreamingResponse.addFilesToZip = function(files, callback) {
    return async.forEachSeries(files, this._addFile, (function(_this) {
      return function(err) {
        if (err) {
          console.error(err);
          return callback(err);
        }
        if (!err) {
          return _this.zip.finalize(callback);
        }
      };
    })(this));
  };

  StreamingResponse.pipe = function(stream, callback) {
    this.setHeaders(stream);
    stream.on("close", (function(_this) {
      return function() {
        _this.streaming = false;
        return _this.streaming;
      };
    })(this));
    this.zip = zipstream.createZip({
      level: 0
    });
    this.zip.pipe(stream);
    return this.addFilesToZip(this.files, callback);
  };

module.exports = StreamingResponse;