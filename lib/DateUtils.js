'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _formatters;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * DateUtils
 */

var YYYYMMDD = 'yyyymmdd';
var ISO8601 = 'iso8601';
var AMZ_ISO8601 = 'amz-iso8601';

var formatters = (_formatters = {}, _defineProperty(_formatters, ISO8601, function (date) {
  return date.toISOString();
}), _defineProperty(_formatters, YYYYMMDD, function (date) {
  return formatters[ISO8601](date).slice(0, 10).replace(/-/g, "");
}), _defineProperty(_formatters, AMZ_ISO8601, function (date) {
  return formatters[YYYYMMDD](date) + 'T000000Z';
}), _formatters);

var dateToString = exports.dateToString = function dateToString(date) {
  var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ISO8601;
  return formatters[format](date);
};