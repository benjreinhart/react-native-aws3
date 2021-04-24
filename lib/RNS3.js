'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RNS3 = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * RNS3
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */

var _Request = require('./Request');

var _S3Policy = require('./S3Policy');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var AWS_DEFAULT_S3_HOST = 's3.amazonaws.com';

var EXPECTED_RESPONSE_KEY_VALUE_RE = {
  key: /<Key>(.*)<\/Key>/,
  etag: /<ETag>"?([^"]*)"?<\/ETag>/,
  bucket: /<Bucket>(.*)<\/Bucket>/,
  location: /<Location>(.*)<\/Location>/
};

var entries = function entries(o) {
  return Object.keys(o).map(function (k) {
    return [k, o[k]];
  });
};

var extractResponseValues = function extractResponseValues(responseText) {
  return entries(EXPECTED_RESPONSE_KEY_VALUE_RE).reduce(function (result, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        regex = _ref2[1];

    var match = responseText.match(regex);
    return _extends({}, result, _defineProperty({}, key, match && match[1]));
  }, {});
};

var setBodyAsParsedXML = function setBodyAsParsedXML(response) {
  return _extends({}, response, {
    body: { postResponse: response.text == null ? null : extractResponseValues(response.text) }
  });
};

var RNS3 = exports.RNS3 = function () {
  function RNS3() {
    _classCallCheck(this, RNS3);
  }

  _createClass(RNS3, null, [{
    key: 'put',
    value: function put(file, options) {
      options = _extends({}, options, {
        key: (options.keyPrefix || '') + file.name,
        date: new Date(),
        contentType: file.type
      });

      var url = 'https://' + options.bucket + '.' + (options.awsUrl || AWS_DEFAULT_S3_HOST);
      var method = "POST";
      var policy = _S3Policy.S3Policy.generate(options);

      return _Request.Request.create(url, method, policy).set("file", file).send().then(setBodyAsParsedXML);
    }
  }]);

  return RNS3;
}();