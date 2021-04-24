"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Request
 */

var isBlank = function isBlank(string) {
  return null == string || !/\S/.test(string);
};

var notBlank = function notBlank(string) {
  return !isBlank(string);
};

var parseHeaders = function parseHeaders(xhr) {
  return (xhr.getAllResponseHeaders() || '').split(/\r?\n/).filter(notBlank).reduce(function (headers, headerString) {
    var header = headerString.split(":")[0];
    headers[header] = xhr.getResponseHeader(header);
    return headers;
  }, {});
};

var buildResponseObject = function buildResponseObject(xhr) {
  var headers = {};
  try {
    headers = parseHeaders(xhr);
  } catch (e) {};
  return {
    status: xhr.status,
    text: xhr.responseText,
    headers: headers
  };
};

var buildResponseHandler = function buildResponseHandler(xhr, resolve, reject) {
  return function () {
    var fn = xhr.status === 0 ? reject : resolve;
    fn(buildResponseObject(xhr));
  };
};

var decorateProgressFn = function decorateProgressFn(fn) {
  return function (e) {
    e.percent = e.loaded / e.total;
    return fn(e);
  };
};

var Request = exports.Request = function () {
  _createClass(Request, null, [{
    key: "create",
    value: function create() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return new (Function.prototype.bind.apply(this, [null].concat(args)))();
    }
  }]);

  function Request(url, method) {
    var _this = this;

    var attrs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, Request);

    this._xhr = new Request.XMLHttpRequest();
    this._formData = new Request.FormData();

    this._xhr.open(method, url);

    this._promise = new Promise(function (resolve, reject) {
      _this._xhr.onload = buildResponseHandler(_this._xhr, resolve, reject);
      _this._xhr.onerror = buildResponseHandler(_this._xhr, resolve, reject);
    });

    Object.keys(attrs).forEach(function (k) {
      return _this.set(k, attrs[k]);
    });
    Object.keys(headers).forEach(function (k) {
      return _this.header(k, headers[k]);
    });
  }

  _createClass(Request, [{
    key: "header",
    value: function header(key, value) {
      this._xhr.setRequestHeader(key, value);
      return this;
    }
  }, {
    key: "set",
    value: function set(key, value) {
      this._formData.append(key, value);
      return this;
    }
  }, {
    key: "send",
    value: function send() {
      this._xhr.send(this._formData);
      return this;
    }
  }, {
    key: "abort",
    value: function abort() {
      this._xhr.abort();
      return this;
    }
  }, {
    key: "progress",
    value: function progress(fn) {
      if (this._xhr.upload) {
        this._xhr.upload.onprogress = decorateProgressFn(fn);
      }
      return this;
    }
  }, {
    key: "then",
    value: function then() {
      var _promise;

      this._promise = (_promise = this._promise).then.apply(_promise, arguments);
      return this;
    }
  }, {
    key: "catch",
    value: function _catch() {
      var _promise2;

      this._promise = (_promise2 = this._promise).catch.apply(_promise2, arguments);
      return this;
    }
  }]);

  return Request;
}();

Request.FormData = FormData;
Request.XMLHttpRequest = XMLHttpRequest;