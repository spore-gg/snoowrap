"use strict";

var _axios = _interopRequireDefault(require("axios"));

var _querystring = require("querystring");

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var FormData = _helpers.isBrowser ? global.FormData : require('form-data');

_axios.default.interceptors.request.use(
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (config) {
    var isSpreadable = function (val) {
      return typeof val !== 'string' && !(val instanceof Array);
    };

    var has = function (obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };

    config.baseURL = config.baseURL || config.baseUrl;
    config.url = config.url || config.uri;
    config.headers = isSpreadable(config.headers) ? _objectSpread({}, config.headers) : {};
    config.params = isSpreadable(config.params) ? _objectSpread({}, config.params) : {};
    config.params = isSpreadable(config.qs) ? _objectSpread({}, config.qs, {}, config.params) : config.params;
    config.formData = isSpreadable(config.formData) ? _objectSpread({}, config.formData) : {};
    config.form = isSpreadable(config.form) ? _objectSpread({}, config.form) : {};
    var requestHeaders = {};
    Object.keys(config.headers).forEach(function (key) {
      var newKey = key.toLowerCase();

      if (!_helpers.isBrowser || newKey !== 'user-agent') {
        requestHeaders[newKey] = config.headers[key];
      }
    });
    config.headers = requestHeaders;
    var requestBody;

    if (Object.keys(config.formData).length) {
      requestBody = new FormData();
      Object.keys(config.formData).forEach(function (key) {
        return requestBody.append(key, config.formData[key]);
      });

      if (!_helpers.isBrowser) {
        var contentLength = yield new Promise(function (resolve, reject) {
          requestBody.getLength(function (err, length) {
            if (err) {
              reject(err);
            }

            resolve(length);
          });
        });
        config.headers['content-length'] = contentLength;
        config.headers['content-type'] = "multipart/form-data; boundary=".concat(requestBody._boundary);
      }
    } else if (Object.keys(config.form).length) {
      requestBody = (0, _querystring.stringify)(config.form);
      config.headers['content-type'] = 'application/x-www-form-urlencoded';
    } else {
      requestBody = config.data || config.body;
    }

    config.data = requestBody;

    if (config.auth) {
      if (has(config.auth, 'bearer')) {
        config.headers.authorization = "Bearer ".concat(config.auth.bearer);
      } else if (has(config.auth, 'user') && has(config.auth, 'pass')) {
        config.auth.username = config.auth.user;
        config.auth.password = config.auth.pass;
      }
    }

    if (config._r && config._r._debug) {
      config._r._debug('Request:', config);
    }

    return config;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());

_axios.default.interceptors.response.use(function (response) {
  if (response.config._r && response.config._r._debug) {
    response.config._r._debug('Response:', response);
  }

  return response;
});

module.exports = _axios.default;