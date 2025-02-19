"use strict";

var _lodash = require("lodash");

var _util = _interopRequireDefault(require("util"));

var _path = _interopRequireDefault(require("path"));

var _stream = _interopRequireDefault(require("stream"));

var _fs = require("fs");

var requestHandler = _interopRequireWildcard(require("./request_handler.js"));

var _constants = require("./constants.js");

var errors = _interopRequireWildcard(require("./errors.js"));

var _helpers = require("./helpers.js");

var _create_config = _interopRequireDefault(require("./create_config.js"));

var objects = _interopRequireWildcard(require("./objects/index.js"));

var _MediaFile = _interopRequireWildcard(require("./objects/MediaFile"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var fetch = global.fetch;
var Blob = global.Blob;
var FormData = _helpers.isBrowser ? global.FormData : require('form-data');
var WebSocket = _helpers.isBrowser ? global.WebSocket : require('ws');
var api_type = 'json';
/**
 * The class for a snoowrap requester.
 * A requester is the base object that is used to fetch content from reddit. Each requester contains a single set of OAuth
 * tokens.
 *
 * If constructed with a refresh token, a requester will be able to repeatedly generate access tokens as necessary, without any
 * further user intervention. After making at least one request, a requester will have the `accessToken` property, which specifies
 * the access token currently in use. It will also have a few additional properties such as `scope` (an array of scope strings)
 * and `ratelimitRemaining` (the number of requests remaining for the current 10-minute interval, in compliance with reddit's
 * [API rules](https://github.com/reddit/reddit/wiki/API).) These properties primarily exist for internal use, but they are
 * exposed since they are useful externally as well.
 */

var snoowrap = class snoowrap {
  /**
   * @summary Constructs a new requester.
   * @desc You should use the snoowrap constructor if you are able to authorize a reddit account in advance (e.g. for a Node.js
   * script that always uses the same account). If you aren't able to authorize in advance (e.g. acting through an arbitrary user's
   * account while running snoowrap in a browser), then you should use {@link snoowrap.getAuthUrl} and
   * {@link snoowrap.fromAuthCode} instead.
   *
   * To edit snoowrap specific settings, see {@link snoowrap#config}.
   *
   * snoowrap supports several different options for pre-existing authentication:
   * 1. *Refresh token*: To authenticate with a refresh token, pass an object with the properties `userAgent`, `clientId`,
   * `clientSecret`, and `refreshToken` to the snoowrap constructor. You will need to get the refresh token from reddit
   * beforehand. A script to automatically generate refresh tokens for you can be found
   * [here](https://github.com/not-an-aardvark/reddit-oauth-helper).
   * 1. *Username/password*: To authenticate with a username and password, pass an object with the properties `userAgent`,
   * `clientId`, `clientSecret`, `username`, and `password` to the snoowrap constructor. Note that username/password
   * authentication is only possible for `script`-type apps.
   * 1. *Access token*: To authenticate with an access token, pass an object with the properties `userAgent` and `accessToken`
   * to the snoowrap constructor. Note that all access tokens expire one hour after being generated, so this method is
   * not recommended for long-term use.
   * @param {object} options An object containing authentication options. This should always have the property `userAgent`. It
   * must also contain some combination of credentials (see above)
   * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
   * is running in a browser.
   * @param {string} [options.clientId] The client ID of your app (assigned by reddit)
   * @param {string} [options.clientSecret] The client secret of your app (assigned by reddit). If you are using a refresh token
   * with an installed app (which does not have a client secret), pass an empty string as your `clientSecret`.
   * @param {string} [options.username] The username of the account to access
   * @param {string} [options.password] The password of the account to access
   * @param {string} [options.refreshToken] A refresh token for your app
   * @param {string} [options.accessToken] An access token for your app
   */
  constructor() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        user_agent = _ref.user_agent,
        _ref$userAgent = _ref.userAgent,
        userAgent = _ref$userAgent === void 0 ? user_agent : _ref$userAgent,
        client_id = _ref.client_id,
        _ref$clientId = _ref.clientId,
        clientId = _ref$clientId === void 0 ? client_id : _ref$clientId,
        client_secret = _ref.client_secret,
        _ref$clientSecret = _ref.clientSecret,
        clientSecret = _ref$clientSecret === void 0 ? client_secret : _ref$clientSecret,
        refresh_token = _ref.refresh_token,
        _ref$refreshToken = _ref.refreshToken,
        refreshToken = _ref$refreshToken === void 0 ? refresh_token : _ref$refreshToken,
        access_token = _ref.access_token,
        _ref$accessToken = _ref.accessToken,
        accessToken = _ref$accessToken === void 0 ? access_token : _ref$accessToken,
        username = _ref.username,
        password = _ref.password;

    if (!userAgent && !_helpers.isBrowser) {
      return (0, _helpers.requiredArg)('userAgent');
    }

    if ((!accessToken || typeof accessToken !== 'string') && (clientId === undefined || clientSecret === undefined || typeof refreshToken !== 'string') && (clientId === undefined || clientSecret === undefined || username === undefined || password === undefined)) {
      throw new errors.NoCredentialsError();
    }

    if (_helpers.isBrowser) {
      this.userAgent = global.navigator.userAgent;
    }

    (0, _lodash.defaults)(this, {
      userAgent,
      clientId,
      clientSecret,
      refreshToken,
      accessToken,
      username,
      password
    }, {
      clientId: null,
      clientSecret: null,
      refreshToken: null,
      accessToken: null,
      username: null,
      password: null,
      ratelimitRemaining: null,
      ratelimitExpiration: null,
      tokenExpiration: null,
      scope: null,
      _config: (0, _create_config.default)(),
      _nextRequestTimestamp: -Infinity
    });
    (0, _helpers.addSnakeCaseShadowProps)(this);
  }
  /**
   * @summary Gets an authorization URL, which allows a user to authorize access to their account
   * @desc This create a URL where a user can authorize an app to act through their account. If the user visits the returned URL
   * in a web browser, they will see a page that looks like [this](https://i.gyazo.com/0325534f38b78c1dbd4c84d690dda6c2.png). If
   * the user clicks "Allow", they will be redirected to your `redirectUri`, with a `code` querystring parameter containing an
   * *authorization code*. If this code is passed to {@link snoowrap.fromAuthCode}, you can create a requester to make
   * requests on behalf of the user.
   *
   * The main use-case here is for running snoowrap in a browser. You can generate a URL, send the user there, and then continue
   * after the user authenticates on reddit and is redirected back.
   *
   * @param {object} options
   * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
   * browser, using an "Installed" app type is recommended.
   * @param {string[]} [options.scope=['*']] An array of scopes (permissions on the user's account) to request on the authentication
   * page. A list of possible scopes can be found [here](https://www.reddit.com/api/v1/scopes). You can also get them on-the-fly
   * with {@link snoowrap#getOauthScopeList}. Passing an array with a single asterisk `['*']` gives you full scope.
   * @param {string} options.redirectUri The URL where the user should be redirected after authenticating. This **must** be the
   * same as the redirect URI that is configured for the reddit app. (If there is a mismatch, the returned URL will display an
   * error page instead of an authentication form.)
   * @param {boolean} [options.permanent=true] If `true`, the app will have indefinite access to the user's account. If `false`,
   * access to the user's account will expire after 1 hour.
   * @param {string} [options.state] A string that can be used to verify a user after they are redirected back to the site. When
   * the user is redirected from reddit, to the redirect URI after authenticating, the resulting URI will have this same `state`
   * value in the querystring. (See [here](http://www.twobotechnologies.com/blog/2014/02/importance-of-state-in-oauth2.html) for
   * more information on how to use the `state` value.)
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain for the URL. If the user is authenticating on
   * reddit.com (as opposed to some other site with a reddit-like API), you can omit this value.
   * @param {boolean} [options.compact=false] If `true`, the mobile version of the authorization URL will be used instead.
   * @returns {string} A URL where the user can authenticate with the given options
   * @example
   *
   * var authenticationUrl = snoowrap.getAuthUrl({
   *   clientId: 'foobarbazquuux',
   *   scope: ['identity', 'wikiread', 'wikiedit'],
   *   redirectUri: 'https://example.com/reddit_callback',
   *   permanent: false,
   *   state: 'fe211bebc52eb3da9bef8db6e63104d3' // a random string, this could be validated when the user is redirected back
   * });
   * // --> 'https://www.reddit.com/api/v1/authorize?client_id=foobarbaz&response_type=code&state= ...'
   *
   * window.location.href = authenticationUrl; // send the user to the authentication url
   */


  static getAuthUrl(_ref2) {
    var _ref2$clientId = _ref2.clientId,
        clientId = _ref2$clientId === void 0 ? (0, _helpers.requiredArg)('clientId') : _ref2$clientId,
        _ref2$scope = _ref2.scope,
        scope = _ref2$scope === void 0 ? ['*'] : _ref2$scope,
        _ref2$redirectUri = _ref2.redirectUri,
        redirectUri = _ref2$redirectUri === void 0 ? (0, _helpers.requiredArg)('redirectUri') : _ref2$redirectUri,
        _ref2$permanent = _ref2.permanent,
        permanent = _ref2$permanent === void 0 ? true : _ref2$permanent,
        _ref2$state = _ref2.state,
        state = _ref2$state === void 0 ? '_' : _ref2$state,
        _ref2$endpointDomain = _ref2.endpointDomain,
        endpointDomain = _ref2$endpointDomain === void 0 ? 'reddit.com' : _ref2$endpointDomain,
        _ref2$compact = _ref2.compact,
        compact = _ref2$compact === void 0 ? false : _ref2$compact;

    if (!(Array.isArray(scope) && scope.length && scope.every(function (scopeValue) {
      return scopeValue && typeof scopeValue === 'string';
    }))) {
      throw new TypeError('Missing `scope` argument; a non-empty list of OAuth scopes must be provided');
    }

    return "\n      https://www.".concat(endpointDomain, "/api/v1/authorize\n      ").concat(compact ? '.compact' : '', "\n      ?client_id=").concat(encodeURIComponent(clientId), "\n      &response_type=code\n      &state=").concat(encodeURIComponent(state), "\n      &redirect_uri=").concat(encodeURIComponent(redirectUri), "\n      &duration=").concat(permanent ? 'permanent' : 'temporary', "\n      &scope=").concat(encodeURIComponent(scope.join(' ')), "\n    ").replace(/\s/g, '');
  }
  /**
   * @summary Creates a snoowrap requester from an authorization code.
   * @desc An authorization code is the `code` value that appears in the querystring after a user authenticates with reddit and
   * is redirected. For more information, see {@link snoowrap.getAuthUrl}.
   *
   * The main use-case for this function is for running snoowrap in a browser. You can generate a URL with
   * {@link snoowrap.getAuthUrl} and send the user to that URL, and then use this function to create a requester when
   * the user is redirected back with an authorization code.
   * @param {object} options
   * @param {string} options.code The authorization code
   * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
   * is running in a browser.
   * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
   * browser, using an "Installed" app type is recommended.
   * @param {string} [options.clientSecret] The client secret of your app. If your app has the "Installed" app type, omit
   * this parameter.
   * @param {string} options.redirectUri The redirect URI that is configured for the reddit app.
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain that the returned requester should be configured
   * to use. If the user is authenticating on reddit.com (as opposed to some other site with a reddit-like API), you can omit this
   * value.
   * @returns {Promise<snoowrap>} A Promise that fulfills with a `snoowrap` instance
   * @example
   *
   * // Get the `code` querystring param (assuming the user was redirected from reddit)
   * var code = new URL(window.location.href).searchParams.get('code');
   *
   * snoowrap.fromAuthCode({
   *   code: code,
   *   userAgent: 'My app',
   *   clientId: 'foobarbazquuux',
   *   redirectUri: 'example.com'
   * }).then(r => {
   *   // Now we have a requester that can access reddit through the user's account
   *   return r.getHot().then(posts => {
   *     // do something with posts from the front page
   *   });
   * })
   */


  static fromAuthCode(_ref3) {
    var _this = this;

    var _ref3$code = _ref3.code,
        code = _ref3$code === void 0 ? (0, _helpers.requiredArg)('code') : _ref3$code,
        _ref3$userAgent = _ref3.userAgent,
        userAgent = _ref3$userAgent === void 0 ? _helpers.isBrowser ? global.navigator.userAgent : (0, _helpers.requiredArg)('userAgent') : _ref3$userAgent,
        _ref3$clientId = _ref3.clientId,
        clientId = _ref3$clientId === void 0 ? (0, _helpers.requiredArg)('clientId') : _ref3$clientId,
        clientSecret = _ref3.clientSecret,
        _ref3$redirectUri = _ref3.redirectUri,
        redirectUri = _ref3$redirectUri === void 0 ? (0, _helpers.requiredArg)('redirectUri') : _ref3$redirectUri,
        _ref3$endpointDomain = _ref3.endpointDomain,
        endpointDomain = _ref3$endpointDomain === void 0 ? 'reddit.com' : _ref3$endpointDomain;
    return _asyncToGenerator(function* () {
      var response = yield _this.prototype.credentialedClientRequest.call({
        userAgent,
        clientId,
        clientSecret,
        // Use `this.prototype.rawRequest` function to allow for custom `rawRequest` method usage in subclasses.
        rawRequest: _this.prototype.rawRequest
      }, {
        method: 'post',
        baseURL: "https://www.".concat(endpointDomain, "/"),
        url: 'api/v1/access_token',
        form: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        }
      });

      if (response.data.error) {
        throw new errors.RequestError("API Error: ".concat(response.data.error, " - ").concat(response.data.error_description));
      } // Use `new this` instead of `new snoowrap` to ensure that subclass instances can be returned


      var requester = new _this(_objectSpread({
        userAgent,
        clientId,
        clientSecret
      }, response.data));
      requester.tokenExpiration = Date.now() + response.data.expires_in * 1000;
      requester.scope = response.data.scope.split(' ');
      requester.config({
        endpointDomain
      });
      return requester;
    })();
  }
  /**
   * @summary Returns the grant types available for app-only authentication
   * @desc Per the Reddit API OAuth docs, there are two different grant types depending on whether the app is an installed client
   * or a confidential client such as a web app or string. This getter returns the possible values for the "grant_type" field
   * in application-only auth.
   * @returns {object} The enumeration of possible grant_type values
   */


  static get grantType() {
    return {
      CLIENT_CREDENTIALS: 'client_credentials',
      INSTALLED_CLIENT: 'https://oauth.reddit.com/grants/installed_client'
    };
  }
  /**
  * @summary Creates a snoowrap requester from a "user-less" Authorization token
  * @desc In some cases, 3rd party app clients may wish to make API requests without a user context. App clients can request
  * a "user-less" Authorization token via either the standard client_credentials grant, or the reddit specific
  * extension to this grant, https://oauth.reddit.com/grants/installed_client. Which grant type an app uses depends on
  * the app-type and its use case.
  * @param {object} options
  * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
  * is running in a browser.
  * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
  * browser, using an "Installed" app type is recommended.
  * @param {string} [options.clientSecret] The client secret of your app. Only required for "client_credentials" grant type.
  * @param {string} [options.deviceId] A unique, per-device ID generated by your client. Only required
  * for "Installed" grant type, needs to be between 20-30 characters long. From the reddit docs: "reddit *may* choose to use
  * this ID to generate aggregate data about user counts. Clients that wish to remain anonymous should use the value
  * DO_NOT_TRACK_THIS_DEVICE."
  * @param {string} [options.grantType=snoowrap.grantType.INSTALLED_CLIENT] The type of "user-less"
  * token to use {@link snoowrap.grantType}
  * @param {boolean} [options.permanent=true] If `true`, the app will have indefinite access. If `false`,
  * access will expire after 1 hour.
  * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain that the returned requester should be configured
  * to use. If the user is authenticating on reddit.com (as opposed to some other site with a reddit-like API), you can omit this
  * value.
  * @returns {Promise<snoowrap>} A Promise that fulfills with a `snoowrap` instance
  * @example
  *
  * snoowrap.fromApplicationOnlyAuth({
  *   userAgent: 'My app',
  *   clientId: 'foobarbazquuux',
  *   deviceId: 'unique id between 20-30 chars',
  *   grantType: snoowrap.grantType.INSTALLED_CLIENT
  * }).then(r => {
  *   // Now we have a requester that can access reddit through a "user-less" Auth token
  *   return r.getHot().then(posts => {
  *     // do something with posts from the front page
  *   });
  * })
  *
  * snoowrap.fromApplicationOnlyAuth({
  *   userAgent: 'My app',
  *   clientId: 'foobarbazquuux',
  *   clientSecret: 'your web app secret',
  *   grantType: snoowrap.grantType.CLIENT_CREDENTIALS
  * }).then(r => {
  *   // Now we have a requester that can access reddit through a "user-less" Auth token
  *   return r.getHot().then(posts => {
  *     // do something with posts from the front page
  *   });
  * })
  */


  static fromApplicationOnlyAuth(_ref4) {
    var _this2 = this;

    var _ref4$userAgent = _ref4.userAgent,
        userAgent = _ref4$userAgent === void 0 ? _helpers.isBrowser ? global.navigator.userAgent : (0, _helpers.requiredArg)('userAgent') : _ref4$userAgent,
        _ref4$clientId = _ref4.clientId,
        clientId = _ref4$clientId === void 0 ? (0, _helpers.requiredArg)('clientId') : _ref4$clientId,
        clientSecret = _ref4.clientSecret,
        deviceId = _ref4.deviceId,
        _ref4$grantType = _ref4.grantType,
        grantType = _ref4$grantType === void 0 ? snoowrap.grantType.INSTALLED_CLIENT : _ref4$grantType,
        _ref4$permanent = _ref4.permanent,
        permanent = _ref4$permanent === void 0 ? true : _ref4$permanent,
        _ref4$endpointDomain = _ref4.endpointDomain,
        endpointDomain = _ref4$endpointDomain === void 0 ? 'reddit.com' : _ref4$endpointDomain;
    return _asyncToGenerator(function* () {
      var response = yield _this2.prototype.credentialedClientRequest.call({
        clientId,
        clientSecret,
        // Use `this.prototype.rawRequest` function to allow for custom `rawRequest` method usage in subclasses.
        rawRequest: _this2.prototype.rawRequest
      }, {
        method: 'post',
        baseURL: "https://www.".concat(endpointDomain, "/"),
        url: 'api/v1/access_token',
        form: {
          grant_type: grantType,
          device_id: deviceId,
          duration: permanent ? 'permanent' : 'temporary'
        }
      });

      if (response.data.error) {
        throw new errors.RequestError("API Error: ".concat(response.data.error, " - ").concat(response.data.error_description));
      } // Use `new this` instead of `new snoowrap` to ensure that subclass instances can be returned


      var requester = new _this2(_objectSpread({
        userAgent,
        clientId,
        clientSecret
      }, response.data));
      requester.tokenExpiration = Date.now() + response.data.expires_in * 1000;
      requester.scope = response.data.scope.split(' ');
      requester.config({
        endpointDomain
      });
      return requester;
    })();
  }
  /**
   * @summary Retrieves or modifies the configuration options for this snoowrap instance.
   * @param {object} [options] A map of `{[config property name]: value}`. Note that any omitted config properties will simply
   * retain whatever value they had previously. (In other words, if you only want to change one property, you only need to put
   * that one property in this parameter. To get the current configuration without modifying anything, simply omit this
   * parameter.)
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint where requests should be sent
   * @param {Number} [options.requestDelay=0] A minimum delay, in milliseconds, to enforce between API calls. If multiple
   * api calls are requested during this timespan, they will be queued and sent one at a time. Setting this to more than 1000 will
   * ensure that reddit's ratelimit is never reached, but it will make things run slower than necessary if only a few requests
   * are being sent. If this is set to zero, snoowrap will not enforce any delay between individual requests. However, it will
   * still refuse to continue if reddit's enforced ratelimit (600 requests per 10 minutes) is exceeded.
   * @param {Number} [options.requestTimeout=30000] A timeout for all OAuth requests, in milliseconds. If the reddit server
   * fails to return a response within this amount of time, the Promise will be rejected with a timeout error.
   * @param {boolean} [options.continueAfterRatelimitError=false] Determines whether snoowrap should queue API calls if
   * reddit's ratelimit is exceeded. If set to `true` when the ratelimit is exceeded, snoowrap will queue all further requests,
   * and will attempt to send them again after the current ratelimit period expires (which happens every 10 minutes). If set
   * to `false`, snoowrap will simply throw an error when reddit's ratelimit is exceeded.
   * @param {Number[]} [options.retryErrorCodes=[502, 503, 504, 522]] If reddit responds to an idempotent request with one of
   * these error codes, snoowrap will retry the request, up to a maximum of `max_retry_attempts` requests in total. (These
   * errors usually indicate that there was an temporary issue on reddit's end, and retrying the request has a decent chance of
   * success.) This behavior can be disabled by simply setting this property to an empty array.
   * @param {Number} [options.maxRetryAttempts=3] See `retryErrorCodes`.
   * @param {boolean} [options.warnings=true] snoowrap may occasionally log warnings, such as deprecation notices, to the
   * console. These can be disabled by setting this to `false`.
   * @param {boolean} [options.debug=false] If set to true, snoowrap will print out potentially-useful information for debugging
   * purposes as it runs.
   * @param {object} [options.logger=console] By default, snoowrap will log any warnings and debug output to the console.
   * A custom logger object may be supplied via this option; it must expose `warn`, `info`, `debug`, and `trace` functions.
   * @param {boolean} [options.proxies=true] Setting this to `false` disables snoowrap's method-chaining feature. This causes
   * the syntax for using snoowrap to become a bit heavier, but allows for consistency between environments that support the ES6
   * `Proxy` object and environments that don't. This option is a no-op in environments that don't support the `Proxy` object,
   * since method chaining is always disabled in those environments. Note, changing this setting must be done before making
   * any requests.
   * @returns {object} An updated Object containing all of the configuration values
   * @example
   *
   * r.config({requestDelay: 1000, warnings: false});
   * // sets the request delay to 1000 milliseconds, and suppresses warnings.
   */


  config() {
    var _this3 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var invalidKey = Object.keys(options).find(function (key) {
      return !(key in _this3._config);
    });

    if (invalidKey) {
      throw new TypeError("Invalid config option '".concat(invalidKey, "'"));
    }

    return Object.assign(this._config, options);
  }

  _warn() {
    if (this._config.warnings) {
      var _this$_config$logger;

      (_this$_config$logger = this._config.logger).warn.apply(_this$_config$logger, arguments);
    }
  }

  _debug() {
    if (this._config.debug) {
      var _this$_config$logger2;

      (_this$_config$logger2 = this._config.logger).debug.apply(_this$_config$logger2, arguments);
    }
  }

  _newObject(objectType, content) {
    var _hasFetched = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    return Array.isArray(content) ? content : new snoowrap.objects[objectType](content, this, _hasFetched);
  }
  /**
   * @summary Gets information on a reddit user with a given name.
   * @param {string} name - The user's username
   * @returns {RedditUser} An unfetched RedditUser object for the requested user
   * @example
   *
   * r.getUser('not_an_aardvark')
   * // => RedditUser { name: 'not_an_aardvark' }
   * r.getUser('not_an_aardvark').link_karma.then(console.log)
   * // => 6
   */


  getUser(name) {
    return this._newObject('RedditUser', {
      name: (name + '').replace(/^\/?u\//, '')
    });
  }
  /**
   * @summary Gets information on a comment with a given id.
   * @param {string} commentId - The base36 id of the comment
   * @param {string|null} [submissionId] - The id of the submission that the comment belongs to. The replies
   * tree will only be available when providing this param. However you still can fetch it separately
   * @param {string} [sort] - Determines how the replies tree should be sorted. One of `confidence,
   * top, new, controversial, old, random, qa, live`
   * @returns {Comment} An unfetched Comment object for the requested comment
   * @example
   *
   * const comment = r.getComment('c0b6xx0', '92dd8', 'new')
   * // => Comment { name: 't1_c0b6xx0', link_id: 't3_92dd8', _sort: 'new' }
   * comment.fetch().then(cmt => console.log(cmt.author.name))
   * // => 'Kharos'
   */


  getComment(commentId, submissionId, sort) {
    return this._newObject('Comment', {
      name: (0, _helpers.addFullnamePrefix)(commentId, 't1_'),
      link_id: submissionId ? (0, _helpers.addFullnamePrefix)(submissionId, 't3_') : null,
      _sort: sort
    });
  }
  /**
   * @summary Gets information on a given subreddit.
   * @param {string} displayName - The name of the subreddit (e.g. 'AskReddit')
   * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
   * @example
   *
   * r.getSubreddit('AskReddit')
   * // => Subreddit { display_name: 'AskReddit' }
   * r.getSubreddit('AskReddit').created_utc.then(console.log)
   * // => 1201233135
   */


  getSubreddit(displayName) {
    return this._newObject('Subreddit', {
      display_name: displayName.replace(/^\/?r\//, '')
    });
  }
  /**
   * @summary Gets information on a given submission.
   * @param {string} submissionId - The base36 id of the submission
   * @param {string} [sort] - Determines how the comments tree should be sorted. One of `confidence,
   * top, new, controversial, old, random, qa, live`
   * @returns {Submission} An unfetched Submission object for the requested submission
   * @example
   *
   * const submission = r.getSubmission('2np694', 'top')
   * // => Submission { name: 't3_2np694', _sort: 'top' }
   * submission.fetch().then(sub => console.log(sub.title))
   * // => 'What tasty food would be distusting if eaten over rice?'
   */


  getSubmission(submissionId, sort) {
    return this._newObject('Submission', {
      name: (0, _helpers.addFullnamePrefix)(submissionId, 't3_'),
      _sort: sort
    });
  }
  /**
   * @summary Gets a private message by ID.
   * @param {string} messageId The base36 ID of the message
   * @returns {PrivateMessage} An unfetched PrivateMessage object for the requested message
   * @example
   *
   * r.getMessage('51shnw')
   * // => PrivateMessage { name: 't4_51shnw' }
   * r.getMessage('51shnw').subject.then(console.log)
   * // => 'Example'
   * // See here for a screenshot of the PM in question https://i.gyazo.com/24f3b97e55b6ff8e3a74cb026a58b167.png
   */


  getMessage(messageId) {
    return this._newObject('PrivateMessage', {
      name: (0, _helpers.addFullnamePrefix)(messageId, 't4_')
    });
  }
  /**
   * Gets a livethread by ID.
   * @param {string} threadId The base36 ID of the livethread
   * @returns {LiveThread} An unfetched LiveThread object
   * @example
   *
   * r.getLivethread('whrdxo8dg9n0')
   * // => LiveThread { id: 'whrdxo8dg9n0' }
   * r.getLivethread('whrdxo8dg9n0').nsfw.then(console.log)
   * // => false
   */


  getLivethread(threadId) {
    return this._newObject('LiveThread', {
      id: (0, _helpers.addFullnamePrefix)(threadId, 'LiveUpdateEvent_').slice(16)
    });
  }
  /**
   * @summary Gets information on the requester's own user profile.
   * @returns {RedditUser} A RedditUser object corresponding to the requester's profile
   * @example
   *
   * r.getMe().then(console.log);
   * // => RedditUser { is_employee: false, has_mail: false, name: 'snoowrap_testing', ... }
   */


  getMe() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      var result = yield _this4._get({
        url: 'api/v1/me'
      });
      _this4._ownUserInfo = _this4._newObject('RedditUser', result, true);
      return _this4._ownUserInfo;
    })();
  }

  _getMyName() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      return _this5._ownUserInfo ? _this5._ownUserInfo.name : (yield _this5.getMe()).name;
    })();
  }
  /**
   * @summary Gets a distribution of the requester's own karma distribution by subreddit.
   * @returns {Promise} A Promise for an object with karma information
   * @example
   *
   * r.getKarma().then(console.log)
   * // => [
   * //  { sr: Subreddit { display_name: 'redditdev' }, comment_karma: 16, link_karma: 1 },
   * //  { sr: Subreddit { display_name: 'programming' }, comment_karma: 2, link_karma: 1 },
   * //  ...
   * // ]
   */


  getKarma() {
    return this._get({
      url: 'api/v1/me/karma'
    });
  }
  /**
   * @summary Gets information on the user's current preferences.
   * @returns {Promise} A promise for an object containing the user's current preferences
   * @example
   *
   * r.getPreferences().then(console.log)
   * // => { default_theme_sr: null, threaded_messages: true, hide_downs: false, ... }
   */


  getPreferences() {
    return this._get({
      url: 'api/v1/me/prefs'
    });
  }
  /**
   * @summary Updates the user's current preferences.
   * @param {object} updatedPreferences An object of the form {[some preference name]: 'some value', ...}. Any preference
   * not included in this object will simply retain its current value.
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.updatePreferences({threaded_messages: false, hide_downs: true})
   * // => { default_theme_sr: null, threaded_messages: false, hide_downs: true, ... }
   * // (preferences updated on reddit)
   */


  updatePreferences(updatedPreferences) {
    return this._patch({
      url: 'api/v1/me/prefs',
      data: updatedPreferences
    });
  }
  /**
   * @summary Gets the currently-authenticated user's trophies.
   * @returns {Promise} A TrophyList containing the user's trophies
   * @example
   *
   * r.getMyTrophies().then(console.log)
   * // => TrophyList { trophies: [
   * //   Trophy { icon_70: 'https://s3.amazonaws.com/redditstatic/award/verified_email-70.png',
   * //     description: null,
   * //     url: null,
   * //     icon_40: 'https://s3.amazonaws.com/redditstatic/award/verified_email-40.png',
   * //     award_id: 'o',
   * //     id: '16fn29',
   * //     name: 'Verified Email'
   * //   }
   * // ] }
   */


  getMyTrophies() {
    return this._get({
      url: 'api/v1/me/trophies'
    });
  }
  /**
   * @summary Gets the list of the currently-authenticated user's friends.
   * @returns {Promise} A Promise that resolves with a list of friends
   * @example
   *
   * r.getFriends().then(console.log)
   * // => [ [ RedditUser { date: 1457927963, name: 'not_an_aardvark', id: 't2_k83md' } ], [] ]
   */


  getFriends() {
    return this._get({
      url: 'prefs/friends'
    });
  }
  /**
   * @summary Gets the list of people that the currently-authenticated user has blocked.
   * @returns {Promise} A Promise that resolves with a list of blocked users
   * @example
   *
   * r.getBlockedUsers().then(console.log)
   * // => [ RedditUser { date: 1457928120, name: 'actually_an_aardvark', id: 't2_q3519' } ]
   */


  getBlockedUsers() {
    return this._get({
      url: 'prefs/blocked'
    });
  }
  /**
   * @summary Determines whether the currently-authenticated user needs to fill out a captcha in order to submit content.
   * @returns {Promise} A Promise that resolves with a boolean value
   * @example
   *
   * r.checkCaptchaRequirement().then(console.log)
   * // => false
   */


  checkCaptchaRequirement() {
    return this._get({
      url: 'api/needs_captcha'
    });
  }
  /**
   * @summary Gets the identifier (a hex string) for a new captcha image.
   * @returns {Promise} A Promise that resolves with a string
   * @example
   *
   * r.getNewCaptchaIdentifier().then(console.log)
   * // => 'o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d'
   */


  getNewCaptchaIdentifier() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      var res = yield _this6._post({
        url: 'api/new_captcha',
        form: {
          api_type
        }
      });
      return res.json.data.iden;
    })();
  }
  /**
   * @summary Gets an image for a given captcha identifier.
   * @param {string} identifier The captcha identifier.
   * @returns {Promise} A string containing raw image data in PNG format
   * @example
   *
   * r.getCaptchaImage('o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d').then(console.log)
   // => (A long, incoherent string representing the image in PNG format)
   */


  getCaptchaImage(identifier) {
    return this._get({
      url: "captcha/".concat(identifier)
    });
  }
  /**
   * @summary Gets an array of categories that items can be saved in. (Requires reddit gold)
   * @returns {Promise} An array of categories
   * @example
   *
   * r.getSavedCategories().then(console.log)
   * // => [ { category: 'cute cat pictures' }, { category: 'interesting articles' } ]
   */


  getSavedCategories() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      var res = yield _this7._get({
        url: 'api/saved_categories'
      });
      return res.categories;
    })();
  }
  /**
   * @summary Marks a list of submissions as 'visited'.
   * @desc **Note**: This endpoint only works if the authenticated user is subscribed to reddit gold.
   * @param {Submission[]} links A list of Submission objects to mark
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * var submissions = [r.getSubmission('4a9u54'), r.getSubmission('4a95nb')]
   * r.markAsVisited(submissions)
   * // (the links will now appear purple on reddit)
   */


  markAsVisited(links) {
    return this._post({
      url: 'api/store_visits',
      form: {
        links: links.map(function (sub) {
          return sub.name;
        }).join(',')
      }
    });
  }

  _submit(_ref5) {
    var _this8 = this;

    var subreddit_name = _ref5.subreddit_name,
        _ref5$subredditName = _ref5.subredditName,
        subredditName = _ref5$subredditName === void 0 ? subreddit_name : _ref5$subredditName,
        kind = _ref5.kind,
        title = _ref5.title,
        url = _ref5.url,
        videoPosterUrl = _ref5.videoPosterUrl,
        websocketUrl = _ref5.websocketUrl,
        gallery = _ref5.gallery,
        text = _ref5.text,
        rtjson = _ref5.rtjson,
        choices = _ref5.choices,
        duration = _ref5.duration,
        crosspost_fullname = _ref5.crosspost_fullname,
        _ref5$crosspostFullna = _ref5.crosspostFullname,
        crosspostFullname = _ref5$crosspostFullna === void 0 ? crosspost_fullname : _ref5$crosspostFullna,
        _ref5$resubmit = _ref5.resubmit,
        resubmit = _ref5$resubmit === void 0 ? true : _ref5$resubmit,
        _ref5$send_replies = _ref5.send_replies,
        send_replies = _ref5$send_replies === void 0 ? true : _ref5$send_replies,
        _ref5$sendReplies = _ref5.sendReplies,
        sendReplies = _ref5$sendReplies === void 0 ? send_replies : _ref5$sendReplies,
        _ref5$nsfw = _ref5.nsfw,
        nsfw = _ref5$nsfw === void 0 ? false : _ref5$nsfw,
        _ref5$spoiler = _ref5.spoiler,
        spoiler = _ref5$spoiler === void 0 ? false : _ref5$spoiler,
        flairId = _ref5.flairId,
        flairText = _ref5.flairText,
        collectionId = _ref5.collectionId,
        discussionType = _ref5.discussionType,
        captcha_response = _ref5.captcha_response,
        _ref5$captchaResponse = _ref5.captchaResponse,
        captchaResponse = _ref5$captchaResponse === void 0 ? captcha_response : _ref5$captchaResponse,
        captcha_iden = _ref5.captcha_iden,
        _ref5$captchaIden = _ref5.captchaIden,
        captchaIden = _ref5$captchaIden === void 0 ? captcha_iden : _ref5$captchaIden,
        options = _objectWithoutProperties(_ref5, ["subreddit_name", "subredditName", "kind", "title", "url", "videoPosterUrl", "websocketUrl", "gallery", "text", "rtjson", "choices", "duration", "crosspost_fullname", "crosspostFullname", "resubmit", "send_replies", "sendReplies", "nsfw", "spoiler", "flairId", "flairText", "collectionId", "discussionType", "captcha_response", "captchaResponse", "captcha_iden", "captchaIden"]);

    return _asyncToGenerator(function* () {
      var ws;

      if (websocketUrl) {
        ws = new WebSocket(websocketUrl);
        yield new Promise(function (resolve, reject) {
          ws.onopen = resolve;

          ws.onerror = function () {
            return reject(new errors.WebSocketError('Websocket error.'));
          };
        });
        ws.onerror = null;
      }
      /**
       * Todo: still unsure if `options.resubmit` is supported on gallery/poll submissions
       */


      var result;

      switch (kind) {
        case 'gallery':
          result = yield _this8._post({
            url: 'api/submit_gallery_post.json',
            data: _objectSpread({
              api_type,
              sr: subredditName,
              title,
              items: gallery,
              resubmit,
              sendreplies: sendReplies,
              nsfw,
              spoiler,
              flair_id: flairId,
              flair_text: flairText,
              collection_id: collectionId,
              discussion_type: discussionType,
              captcha: captchaResponse,
              iden: captchaIden
            }, options)
          });
          break;

        case 'poll':
          result = yield _this8._post({
            url: 'api/submit_poll_post',
            data: _objectSpread({
              api_type,
              sr: subredditName,
              title,
              text,
              options: choices,
              duration,
              resubmit,
              sendreplies: sendReplies,
              nsfw,
              spoiler,
              flair_id: flairId,
              flair_text: flairText,
              collection_id: collectionId,
              discussion_type: discussionType,
              captcha: captchaResponse,
              iden: captchaIden
            }, options)
          });
          break;

        default:
          result = yield _this8._post({
            url: 'api/submit',
            form: _objectSpread({
              api_type,
              sr: subredditName,
              kind,
              title,
              url,
              video_poster_url: videoPosterUrl,
              text,
              richtext_json: JSON.stringify(rtjson),
              crosspost_fullname: crosspostFullname,
              resubmit,
              sendreplies: sendReplies,
              nsfw,
              spoiler,
              flair_id: flairId,
              flair_text: flairText,
              collection_id: collectionId,
              discussion_type: discussionType,
              captcha: captchaResponse,
              iden: captchaIden
            }, options)
          });
          break;
      }

      (0, _helpers.handleJsonErrors)(result);

      if (ws) {
        if (ws.readyState !== WebSocket.OPEN) {
          throw new errors.WebSocketError('Websocket error. Your post may still have been created.');
        }

        return new Promise(function (resolve, reject) {
          ws.onmessage = function (event) {
            ws.onclose = null;
            ws.close();
            var data = JSON.parse(event.data);

            if (data.type === 'failed') {
              reject(new errors.MediaPostFailedError());
            }

            var submissionUrl = data.payload.redirect;

            var submissionId = _constants.SUBMISSION_ID_REGEX.exec(submissionUrl)[1];

            resolve(_this8.getSubmission(submissionId));
          };

          ws.onerror = function () {
            return reject(new errors.WebSocketError('Websocket error. Your post may still have been created.'));
          };

          ws.onclose = function () {
            return reject(new errors.WebSocketError('Websocket closed. Your post may still have been created.'));
          };
        });
      }

      return result.json.data.id ? _this8.getSubmission(result.json.data.id) : null;
    })();
  }
  /**
   * @summary Creates a new link submission on the given subreddit.
   * @param {object} options An object containing details about the submission.
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to.
   * @param {string} options.title The title of the submission.
   * @param {string} options.url The url that the link submission should point to.
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission.
   * @param {boolean} [options.resubmit=true] If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   * @param {boolean} [options.spoiler=false] Whether or not the submission should be marked as a spoiler.
   * @param {boolean} [options.nsfw=false] Whether or not the submission should be marked NSFW.
   * @param {string} [options.flairId] The flair template to select.
   * @param {string} [options.flairText] If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   * @param {string} [options.collectionId] The UUID of a collection to add the newly-submitted post to.
   * @param {string} [options.discussionType] Set to `CHAT` to enable live discussion instead of traditional comments.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier.
   * @returns {Promise} The newly-created Submission object.
   * @example
   *
   * r.submitLink({
   *   subredditName: 'snoowrap_testing',
   *   title: 'I found a cool website!',
   *   url: 'https://google.com'
   * }).then(console.log)
   * // => Submission { name: 't3_4abnfe' }
   * // (new linkpost created on reddit)
   */


  submitLink(options) {
    // Todo: Add `options.url` validation.
    return this._submit(_objectSpread({}, options, {
      kind: 'link'
    }));
  }
  /**
   * @summary Submit an image submission to the given subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param {object} options An object containing details about the submission.
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to.
   * @param {string} options.title The title of the submission.
   * @param {string|stream.Readable|Blob|File|MediaImg} options.imageFile The image that should get submitted. This should either be the path to
   * the image file you want to upload, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) /
   * [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) / [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments
   * (e.g. browsers) where the filesystem is unavailable. Alternatively you can diractly pass a ready-to-use {@link MediaImg} instead.
   * See {@link snoowrap#uploadMedia} for more details.
   * @param {string} options.imageFileName The name that the image file should have. Required when it cannot be diractly extracted from
   * the provided file (e.g ReadableStream, Blob).
   * @param {boolean} [options.noWebsockets=false] Set to `true` to disable use of WebSockets. If `true`, this method will return `null`.
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission.
   * @param {boolean} [options.resubmit=true] If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   * @param {boolean} [options.spoiler=false] Whether or not the submission should be marked as a spoiler.
   * @param {boolean} [options.nsfw=false] Whether or not the submission should be marked NSFW.
   * @param {string} [options.flairId] The flair template to select.
   * @param {string} [options.flairText] If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   * @param {string} [options.collectionId] The UUID of a collection to add the newly-submitted post to.
   * @param {string} [options.discussionType] Set to `CHAT` to enable live discussion instead of traditional comments.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier.
   * @returns {Promise} The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const blob = await (await fetch("https://example.com/kittens.jpg")).blob()
   * r.submitImage({
   *   subredditName: 'snoowrap_testing',
   *   title: 'Take a look at those cute kittens <3',
   *   imageFile: blob, // Usage as a `Blob`.
   *   imageFileName: 'kittens.jpg'
   * }).then(console.log)
   * // => Submission
   * // (new image submission created on reddit)
   */


  submitImage(_ref6) {
    var _this9 = this;

    var imageFile = _ref6.imageFile,
        imageFileName = _ref6.imageFileName,
        noWebsockets = _ref6.noWebsockets,
        options = _objectWithoutProperties(_ref6, ["imageFile", "imageFileName", "noWebsockets"]);

    return _asyncToGenerator(function* () {
      var url, websocketUrl;

      try {
        var _ref7 = imageFile instanceof _MediaFile.MediaImg ? imageFile : yield _this9.uploadMedia({
          file: imageFile,
          name: imageFileName,
          type: 'img'
        }),
            fileUrl = _ref7.fileUrl,
            wsUrl = _ref7.websocketUrl;

        url = fileUrl;
        websocketUrl = wsUrl;
      } catch (err) {
        throw new Error('An error has occurred with the image file: ' + err.message);
      }

      return _this9._submit(_objectSpread({}, options, {
        kind: 'image',
        url,
        websocketUrl: noWebsockets ? null : websocketUrl
      }));
    })();
  }
  /**
   * @summary Submit a video or videogif submission to the given subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param {object} options An object containing details about the submission.
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to.
   * @param {string} options.title The title of the submission.
   * @param {string|stream.Readable|Blob|File|MediaVideo} options.videoFile The video that should get submitted. This should either be the path to
   * the video file you want to upload, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) /
   * [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) / [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments
   * (e.g. browsers) where the filesystem is unavailable. Alternatively you can diractly pass a ready-to-use {@link MediaVideo} instead.
   * See {@link snoowrap#uploadMedia} for more details.
   * @param {string} options.videoFileName The name that the video file should have. Required when it cannot be diractly extracted from
   * the provided file (e.g ReadableStream, Blob).
   * @param {string|stream.Readable|Blob|File|MediaImg} options.thumbnailFile The image that should get uploaded and used as a thumbnail for the video. This
   * should either be the path to the image file you want to upload, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) /
   * [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) / [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments
   * (e.g. browsers) where the filesystem is unavailable. Alternatively you can diractly pass a ready-to-use {@link MediaImg} instead.
   * See {@link snoowrap#uploadMedia} for more details.
   * @param {string} options.thumbnailFileName The name that the thumbnail file should have. Required when it cannot be diractly extracted from
   * the provided file (e.g ReadableStream, Blob).
   * @param {boolean} [options.videogif=false] If `true`, the video is submitted as a videogif, which is essentially a silent video.
   * @param {boolean} [options.noWebsockets=false] Set to `true` to disable use of WebSockets. If `true`, this method will return `null`.
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission.
   * @param {boolean} [options.resubmit=true] If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   * @param {boolean} [options.spoiler=false] Whether or not the submission should be marked as a spoiler.
   * @param {boolean} [options.nsfw=false] Whether or not the submission should be marked NSFW.
   * @param {string} [options.flairId] The flair template to select.
   * @param {string} [options.flairText] If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   * @param {string} [options.collectionId] The UUID of a collection to add the newly-submitted post to.
   * @param {string} [options.discussionType] Set to `CHAT` to enable live discussion instead of traditional comments.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier.
   * @returns {Promise} The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const mediaVideo = await r.uploadMedia({
   *   file: './video.mp4',
   *   type: 'video'
   * })
   * r.submitVideo({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a video!',
   *   videoFile: mediaVideo, // Usage as a `MediaVideo`.
   *   thumbnailFile: fs.createReadStream('./thumbnail.png'), // Usage as a `stream.Readable`.
   *   thumbnailFileName: 'thumbnail.png'
   * }).then(console.log)
   * // => Submission
   * // (new video submission created on reddit)
   */


  submitVideo(_ref8) {
    var _this10 = this;

    var videoFile = _ref8.videoFile,
        videoFileName = _ref8.videoFileName,
        thumbnailFile = _ref8.thumbnailFile,
        thumbnailFileName = _ref8.thumbnailFileName,
        _ref8$videogif = _ref8.videogif,
        videogif = _ref8$videogif === void 0 ? false : _ref8$videogif,
        noWebsockets = _ref8.noWebsockets,
        options = _objectWithoutProperties(_ref8, ["videoFile", "videoFileName", "thumbnailFile", "thumbnailFileName", "videogif", "noWebsockets"]);

    return _asyncToGenerator(function* () {
      var url, videoPosterUrl, websocketUrl;
      var kind = videogif ? 'videogif' : 'video';
      /**
       * Imagin you just finished uploading a large video, then oops! you faced this error: "An error has occurred with the thumbnail file"!
       * In this case we should validate the thumbnail parameters first to ensure that no accidental uploads will happen.
       */

      if (!(thumbnailFile instanceof _MediaFile.MediaImg)) {
        try {
          yield _this10.uploadMedia({
            file: thumbnailFile,
            name: thumbnailFileName,
            type: 'img',
            validateOnly: true
          });
        } catch (err) {
          throw new Error('An error has occurred with the thumbnail file: ' + err.message);
        }
      }
      /**
       * Now we are safe to upload. If the provided video is invalid the error can be easly catched.
       */


      try {
        var _ref9 = videoFile instanceof _MediaFile.MediaVideo ? videoFile : yield _this10.uploadMedia({
          file: videoFile,
          name: videoFileName,
          type: videogif ? 'gif' : 'video'
        }),
            fileUrl = _ref9.fileUrl,
            wsUrl = _ref9.websocketUrl;

        url = fileUrl;
        websocketUrl = wsUrl;
      } catch (err) {
        throw new Error('An error has occurred with the video file: ' + err.message);
      }

      try {
        var _ref10 = thumbnailFile instanceof _MediaFile.MediaImg ? thumbnailFile : yield _this10.uploadMedia({
          file: thumbnailFile,
          name: thumbnailFileName,
          type: 'img'
        }),
            _fileUrl = _ref10.fileUrl;

        videoPosterUrl = _fileUrl;
      } catch (err) {
        throw new Error('An error occurred with the thumbnail file: ' + err.message);
      }

      return _this10._submit(_objectSpread({}, options, {
        kind,
        url,
        videoPosterUrl,
        websocketUrl: noWebsockets ? null : websocketUrl
      }));
    })();
  }
  /**
   * @summary Submit a gallery to the given subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param {object} options An object containing details about the submission.
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to.
   * @param {string} options.title The title of the submission.
   * @param {Array} options.gallery An array containing 2 to 20 gallery items. Currently only images are accepted. A gallery item should
   * either be a {@link MediaImg}, or an object containing `imageFile` and `imageFileName` (the same as `options.imageFile` and `options.imageFileName`
   * used in {@link snoowrap#submitImage}) in addition of an optional `caption` with a maximum of 180 characters along with an optional `outboundUrl`
   * (the same as {@link MediaImg#caption} and {@link MediaImg#outboundUrl}).
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission.
   * @param {boolean} [options.resubmit=true] If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   * @param {boolean} [options.spoiler=false] Whether or not the submission should be marked as a spoiler.
   * @param {boolean} [options.nsfw=false] Whether or not the submission should be marked NSFW.
   * @param {string} [options.flairId] The flair template to select.
   * @param {string} [options.flairText] If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   * @param {string} [options.collectionId] The UUID of a collection to add the newly-submitted post to.
   * @param {string} [options.discussionType] Set to `CHAT` to enable live discussion instead of traditional comments.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier.
   * @returns {Promise} The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const fileinput = document.getElementById('file-input')
   * const files = fileinput.files.map(file => { // Usage as an array of `File`s.
   *   return {
   *     imageFile: file,
   *     caption: file.name
   *   }
   * })
   * const blob = await (await fetch("https://example.com/kittens.jpg")).blob()
   * const mediaImg = await r.uploadMedia({ // Usage as a `MediaImg`.
   *   file: blob,
   *   type: 'img',
   *   caption: 'cute :3',
   *   outboundUrl: 'https://example.com/kittens.html'
   * })
   * r.submitGallery({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a gallery!',
   *   gallery: [mediaImg, ...files]
   * }).then(console.log)
   * // => Submission
   * // (new gallery submission created on reddit)
   */


  submitGallery(_ref11) {
    var _this11 = this;

    var gallery = _ref11.gallery,
        options = _objectWithoutProperties(_ref11, ["gallery"]);

    return _asyncToGenerator(function* () {
      /**
       * Validate every single gallery item to ensure that no accidental uploads will happen.
       */
      yield Promise.all(gallery.map(
      /*#__PURE__*/
      function () {
        var _ref12 = _asyncToGenerator(function* (item, index) {
          try {
            if (item.caption.length > 180) {
              throw new Error('Caption must be 180 characters or less.');
            } // Todo: Add outboundUrl validation.


            if (!(item instanceof _MediaFile.MediaImg)) {
              yield _this11.uploadMedia({
                file: item.imageFile,
                name: item.imageFileName,
                type: 'img',
                validateOnly: true
              });
            }
          } catch (err) {
            throw new Error("An error has occurred with a gallery item at the index ".concat(index, ": ") + err.message);
          }
        });

        return function (_x, _x2) {
          return _ref12.apply(this, arguments);
        };
      }()));
      /**
       * Now we are safe to upload. It still depends on network conditions tho, that's why it is recommended to pass the gallery items
       * as ready-to-use `MediaImg`s instead.
       */

      gallery = yield Promise.all(gallery.map(
      /*#__PURE__*/
      function () {
        var _ref13 = _asyncToGenerator(function* (item, index) {
          try {
            if (!(item instanceof _MediaFile.MediaImg)) {
              item = yield _this11.uploadMedia({
                file: item.imageFile,
                name: item.imageFileName,
                type: 'img',
                caption: item.caption,
                outboundUrl: item.outboundUrl
              });
            }
          } catch (err) {
            throw new Error("An error occurred with a gallery item at the index ".concat(index, ": ") + err.message);
          }

          return {
            caption: item.caption,
            outbound_url: item.outboundUrl,
            media_id: item.assetId
          };
        });

        return function (_x3, _x4) {
          return _ref13.apply(this, arguments);
        };
      }()));
      return _this11._submit(_objectSpread({}, options, {
        kind: 'gallery',
        gallery
      }));
    })();
  }
  /**
   * @summary Creates a new selfpost on the given subreddit.
   * @param {object} options An object containing details about the submission.
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to.
   * @param {string} options.title The title of the submission.
   * @param {string} [options.text] The selftext of the submission.
   * @param {object} [options.inlineMedia] An object containing inctances of `MediaFile` subclasses, or `options` to pass to
   * {@link snoowrap#uploadMedia} where `options.type` is required. The keys of this object can be used as placeholders in
   * `options.text` with the format `{key}`.
   * @param {string} [options.rtjson] The body of the submission in `richtext_json` format. See {@link snoowrap#convertToFancypants}
   * for more details. This will override `options.text` and `options.inlineMedia`.
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission.
   * @param {boolean} [options.resubmit=true] If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   * @param {boolean} [options.spoiler=false] Whether or not the submission should be marked as a spoiler.
   * @param {boolean} [options.nsfw=false] Whether or not the submission should be marked NSFW.
   * @param {string} [options.flairId] The flair template to select.
   * @param {string} [options.flairText] If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   * @param {string} [options.collectionId] The UUID of a collection to add the newly-submitted post to.
   * @param {string} [options.discussionType] Set to `CHAT` to enable live discussion instead of traditional comments.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier.
   * @returns {Promise} The newly-created Submission object.
   * @example
   *
   * const mediaVideo = await r.uploadMedia({
   *   file: './video.mp4',
   *   type: 'video',
   *   caption: 'Short video!'
   * })
   * r.submitSelfpost({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a selfpost',
   *   text: 'This is the text body of the selfpost.\n\nAnd This is an inline image {img} And also a video! {vid}',
   *   inlineMedia: {
   *     img: {
   *       file: './animated.gif', // Usage as a file path.
   *       type: 'img'
   *     },
   *     vid: mediaVideo
   *   }
   * }).then(console.log)
   * // => Submission
   * // (new selfpost created on reddit)
   */


  submitSelfpost(_ref14) {
    var _this12 = this;

    var text = _ref14.text,
        inlineMedia = _ref14.inlineMedia,
        rtjson = _ref14.rtjson,
        options = _objectWithoutProperties(_ref14, ["text", "inlineMedia", "rtjson"]);

    return _asyncToGenerator(function* () {
      /* eslint-disable require-atomic-updates */
      if (rtjson) {
        text = null;
      }

      if (text && inlineMedia) {
        var placeholders = Object.keys(inlineMedia); // Validate inline media

        yield Promise.all(placeholders.map(
        /*#__PURE__*/
        function () {
          var _ref15 = _asyncToGenerator(function* (p) {
            if (!text.includes("{".concat(p, "}"))) {
              return;
            }

            if (!(inlineMedia[p] instanceof _MediaFile.default)) {
              yield _this12.uploadMedia(_objectSpread({}, inlineMedia[p], {
                validateOnly: true
              }));
            }
          });

          return function (_x5) {
            return _ref15.apply(this, arguments);
          };
        }())); // Upload if necessary

        yield Promise.all(placeholders.map(
        /*#__PURE__*/
        function () {
          var _ref16 = _asyncToGenerator(function* (p) {
            if (!text.includes("{".concat(p, "}"))) {
              return;
            }

            if (!(inlineMedia[p] instanceof _MediaFile.default)) {
              inlineMedia[p] = yield _this12.uploadMedia(_objectSpread({}, inlineMedia[p]));
            }
          });

          return function (_x6) {
            return _ref16.apply(this, arguments);
          };
        }()));
        var body = text.replace(_constants.PLACEHOLDER_REGEX, function (_m, g1) {
          return inlineMedia[g1];
        });
        rtjson = yield _this12.convertToFancypants(body);
        text = null;
      }

      return _this12._submit(_objectSpread({}, options, {
        kind: 'self',
        text,
        rtjson
      }));
      /* eslint-enable require-atomic-updates */
    })();
  }
  /**
   * @summary Submit a poll to the given subreddit. (Undocumented endpoint).
   * @param {object} options An object containing details about the submission.
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to.
   * @param {string} options.title The title of the submission.
   * @param {string} [options.text] The selftext of the submission.
   * @param {string[]} options.choices An array of 2 to 6 poll options.
   * @param {number} options.duration The number of days the poll should accept votes. Valid values are between 1 and 7, inclusive.
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission.
   * @param {boolean} [options.resubmit=true] If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   * @param {boolean} [options.spoiler=false] Whether or not the submission should be marked as a spoiler.
   * @param {boolean} [options.nsfw=false] Whether or not the submission should be marked NSFW.
   * @param {string} [options.flairId] The flair template to select.
   * @param {string} [options.flairText] If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   * @param {string} [options.collectionId] The UUID of a collection to add the newly-submitted post to.
   * @param {string} [options.discussionType] Set to `CHAT` to enable live discussion instead of traditional comments.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier.
   * @returns {Promise} The newly-created Submission object.
   * @example
   *
   * r.submitPoll({
   *   subredditName: 'snoowrap_testing',
   *   title: 'Survey!',
   *   text: 'Do you like snoowrap?',
   *   choices: ['YES!', 'NOPE!'],
   *   duration: 3
   * }).then(console.log)
   * // => Submission
   * // (new poll submission created on reddit)
   */


  submitPoll(options) {
    return this._submit(_objectSpread({}, options, {
      kind: 'poll'
    }));
  }
  /**
   * @summary Creates a new crosspost submission on the given subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the crosspost should be submitted to
   * @param {string} options.title The title of the crosspost
   * @param {(string|Submission)} options.originalPost A Submission object or a post ID for the original post which
   * is being crossposted
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission.
   * @param {boolean} [options.resubmit=true] If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   * @param {boolean} [options.spoiler=false] Whether or not the submission should be marked as a spoiler.
   * @param {boolean} [options.nsfw=false] Whether or not the submission should be marked NSFW.
   * @param {string} [options.flairId] The flair template to select.
   * @param {string} [options.flairText] If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   * @param {string} [options.collectionId] The UUID of a collection to add the newly-submitted post to.
   * @param {string} [options.discussionType] Set to `CHAT` to enable live discussion instead of traditional comments.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier.
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * r.submitCrosspost({
   *  title: 'I found an interesting post',
   *  originalPost: '6vths0',
   *  subredditName: 'snoowrap'
   * }).then(console.log)
   * // => Submission
   * // (new crosspost submission created on reddit)
   */


  submitCrosspost(_ref17) {
    var originalPost = _ref17.originalPost,
        options = _objectWithoutProperties(_ref17, ["originalPost"]);

    return this._submit(_objectSpread({}, options, {
      kind: 'crosspost',
      crosspostFullname: originalPost instanceof snoowrap.objects.Submission ? originalPost.name : (0, _helpers.addFullnamePrefix)(originalPost, 't3_')
    }));
  }
  /**
   * @summary Upload media to reddit (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param {object} options An object contains the media file to upload.
   * @param {string|stream.Readable|Blob|File} options.file The media file that should get uploaded. This should either be the path to the file
   * you want to upload, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) /
   * [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) / [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments
   * (e.g. browsers) where the filesystem is unavailable.
   * @param {string} options.name The name that the file should have. Required when it cannot be diractly extracted from the provided
   * file (e.g ReadableStream, Blob).
   * @param {string} [options.type] Determines the media file type. This should be one of `img, video, gif`.
   * @param {boolean} [options.validateOnly] If true, the file won't get uploaded, and this method will return `null`. Useful if you only want
   * to validate the parameters before actually uploading the file.
   * @returns {Promise} A Promise that fulfills with an instance of {@link MediaImg} / {@link MediaVideo} / {@link MediaGif} / {@link MediaFile}
   * depending on the value of `options.type`. Or `null` when `options.validateOnly` is set to `true`.
   * @example
   *
   * const blob = await (await fetch("https://example.com/video.mp4")).blob()
   * r.uploadMedia({
   *   file: blob,
   *   name: 'video.mp4',
   *   type: 'gif',
   *   caption: 'This is a silent video!'
   * }).then(console.log)
   * // => MediaGif
   *
   * r.uploadMedia({
   *   file: './meme.jpg',
   *   caption: 'Funny!',
   *   outboundUrl: 'https://example.com'
   * }).then(console.log)
   * // => MediaFile
   */


  uploadMedia(_ref18) {
    var _this13 = this;

    var file = _ref18.file,
        name = _ref18.name,
        type = _ref18.type,
        caption = _ref18.caption,
        outboundUrl = _ref18.outboundUrl,
        _ref18$validateOnly = _ref18.validateOnly,
        validateOnly = _ref18$validateOnly === void 0 ? false : _ref18$validateOnly;
    return _asyncToGenerator(function* () {
      if (_helpers.isBrowser && typeof fetch === 'undefined') {
        throw new errors.InvalidMethodCallError('Your browser doesn\'t support \'no-cors\' requests');
      }

      if (_helpers.isBrowser && typeof file === 'string') {
        throw new errors.InvalidMethodCallError('Uploaded file cannot be a string on browser');
      } // `File` is a specific kind of `Blob`, so one check for `Blob` is enough


      if (typeof file !== 'string' && !(file instanceof _stream.default.Readable) && !(file instanceof Buffer) && !(typeof Blob !== 'undefined' && file instanceof Blob)) {
        throw new errors.InvalidMethodCallError('Uploaded file must either be a string, a ReadableStream, a Blob, a Buffer or a File');
      }

      var parsedFile = typeof file === 'string' ? (0, _fs.createReadStream)(file) : file;
      var fileName = typeof file === 'string' ? _path.default.basename(file) : file.name || name;

      if (!fileName) {
        (0, _helpers.requiredArg)('name');
      }

      var fileExt = _path.default.extname(fileName) || 'jpeg'; // Default to JPEG

      fileExt = fileExt.replace('.', '');
      var mimetype = typeof Blob !== 'undefined' && file instanceof Blob && file.type ? file.type : _constants.MIME_TYPES[fileExt] || '';
      var expectedMimePrefix = _constants.MEDIA_TYPES[type];

      if (expectedMimePrefix && mimetype.split('/')[0] !== expectedMimePrefix) {
        throw new errors.InvalidMethodCallError("Expected a mimetype for the file '".concat(fileName, "' starting with '").concat(expectedMimePrefix, "' but got '").concat(mimetype, "'"));
      } // Todo: The file size should be checked


      if (validateOnly) {
        return null;
      }

      var uploadResponse = yield _this13._post({
        url: 'api/media/asset.json',
        form: {
          filepath: fileName,
          mimetype
        }
      });
      var uploadURL = 'https:' + uploadResponse.args.action;
      var fileInfo = {
        fileUrl: uploadURL + '/' + uploadResponse.args.fields.find(function (item) {
          return item.name === 'key';
        }).value,
        assetId: uploadResponse.asset.asset_id,
        websocketUrl: uploadResponse.asset.websocket_url,
        caption,
        outboundUrl
      };
      var formdata = new FormData();
      uploadResponse.args.fields.forEach(function (item) {
        return formdata.append(item.name, item.value);
      });
      formdata.append('file', parsedFile, fileName);
      var res;

      if (_helpers.isBrowser) {
        res = yield fetch(uploadURL, {
          method: 'post',
          mode: 'no-cors',
          body: formdata
        });

        _this13._debug('Response:', res);
        /**
         * Todo: Since the response of 'no-cors' requests cannot contain the status code, the uploaded file should be validated
         * by setting `fileInfo.fileUrl` as the `src` attribute of an img/video element and listening to the load event.
         */

      } else {
        var contentLength = yield new Promise(function (resolve, reject) {
          formdata.getLength(function (err, length) {
            if (err) {
              reject(err);
            }

            resolve(length);
          });
        });
        res = yield _this13.rawRequest({
          url: uploadURL,
          method: 'post',
          headers: {
            'user-agent': _this13.userAgent,
            'content-type': "multipart/form-data; boundary=".concat(formdata._boundary),
            'content-length': contentLength
          },
          data: formdata,
          _r: _this13
        });
      }

      var media;

      switch (type) {
        case 'img':
          media = new _MediaFile.MediaImg(fileInfo);
          break;

        case 'video':
          media = new _MediaFile.MediaVideo(fileInfo);
          break;

        case 'gif':
          media = new _MediaFile.MediaGif(fileInfo);
          break;

        default:
          media = new _MediaFile.default(fileInfo);
          break;
      }

      return media;
    })();
  }
  /**
   * @summary Convert `markdown` to `richtext_json` format that used on the fancy pants editor. This format allows
   * to embed inline media on selfposts.
   * @param {string} markdown The Markdown text to convert.
   * @returns {Promise} A Promise that fulfills with an object in `richtext_json` format.
   * @example
   *
   * r.convertToFancypants('Hello **world**!').then(console.log)
   * // => object {document: Array(1)}
   */


  convertToFancypants(markdown) {
    var _this14 = this;

    return _asyncToGenerator(function* () {
      var response = yield _this14._post({
        uri: 'api/convert_rte_body_format',
        form: {
          output_mode: 'rtjson',
          markdown_text: markdown
        }
      });
      return response.output;
    })();
  }

  _getSortedFrontpage(sortType, subredditName) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    // Handle things properly if only a time parameter is provided but not the subreddit name
    var opts = options;
    var subName = subredditName;

    if (typeof subredditName === 'object' && (0, _lodash.isEmpty)((0, _lodash.omitBy)(opts, function (option) {
      return option === undefined;
    }))) {
      /**
       * In this case, "subredditName" ends up referring to the second argument, which is not actually a name since the user
       * decided to omit that parameter.
       */
      opts = subredditName;
      subName = undefined;
    }

    var parsedOptions = (0, _lodash.omit)(_objectSpread({}, opts, {
      t: opts.time || opts.t
    }), 'time');
    return this._getListing({
      uri: (subName ? "r/".concat(subName, "/") : '') + sortType,
      qs: parsedOptions
    });
  }
  /**
   * @summary Gets a Listing of hot posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getHot().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('gifs').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('redditdev', {limit: 1}).then(console.log)
   * // => Listing [
   * //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */


  getHot(subredditName, options) {
    return this._getSortedFrontpage('hot', subredditName, options);
  }
  /**
   * @summary Gets a Listing of best posts.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise<Listing>} A Listing containing the retrieved submissions
   * @example
   *
   * r.getBest().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getBest({limit: 1}).then(console.log)
   * // => Listing [
   * //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */


  getBest(options) {
    return this._getSortedFrontpage('best', undefined, options);
  }
  /**
   * @summary Gets a Listing of new posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getNew().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.Jokes', banned_by: null, subreddit: Subreddit { display_name: 'Jokes' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   *
   */


  getNew(subredditName, options) {
    return this._getSortedFrontpage('new', subredditName, options);
  }
  /**
   * @summary Gets a Listing of new comments.
   * @param {string} [subredditName] The subreddit to get comments from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved comments
   * @example
   *
   * r.getNewComments().then(console.log)
   * // => Listing [
   * //  Comment { link_title: 'What amazing book should be made into a movie, but hasn\'t been yet?', ... }
   * //  Comment { link_title: 'How far back in time could you go and still understand English?', ... }
   * // ]
   */


  getNewComments(subredditName, options) {
    return this._getSortedFrontpage('comments', subredditName, options);
  }
  /**
   *  @summary Get list of content by IDs. Returns a listing of the requested content.
   *  @param {Array<string|Submission|Comment>} ids An array of content IDs. Can include the id itself, or a Submission or Comment object.
   *  can get a post and a comment
   *  @returns {Promise<Listing<Submission|Comment>>} A listing of content requested, can be any class fetchable by API. e.g. Comment, Submission
   *  @example
   *
   * r.getContentByIds(['t3_9l9vof', 't3_9la341']).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
   *
   * r.getContentByIds([r.getSubmission('9l9vof'), r.getSubmission('9la341')]).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
  */


  getContentByIds(ids) {
    if (!Array.isArray(ids)) {
      throw new TypeError('Invalid argument: Argument needs to be an array.');
    }

    var prefixedIds = ids.map(function (id) {
      if (id instanceof snoowrap.objects.Submission || id instanceof snoowrap.objects.Comment) {
        return id.name;
      } else if (typeof id === 'string') {
        if (!/t(1|3)_/g.test(ids)) {
          throw new TypeError('Invalid argument: Ids need to include Submission or Comment prefix, e.g. t1_, t3_.');
        }

        return id;
      }

      throw new TypeError('Id must be either a string, Submission, or Comment.');
    });
    return this._get({
      url: '/api/info',
      params: {
        id: prefixedIds.join(',')
      }
    });
  }
  /**
   * @summary Gets a single random Submission.
   * @desc **Notes**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
   * redirect which cannot be followed by a CORS request. Also, due to a known API issue, this function won't work with subreddits
   * excluded from /r/all, since the reddit server returns the subreddit itself instead of a random submission, in this case
   * the function will return `null`.
   * @param {string} [subredditName] The subreddit to get the random submission. If not provided, the post is fetched from
   * the front page of reddit.
   * @returns {Promise|null} The retrieved Submission object when available
   * @example
   *
   * r.getRandomSubmission('aww').then(console.log)
   * // => Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'aww' }, ... }
   */


  getRandomSubmission(subredditName) {
    var _this15 = this;

    return _asyncToGenerator(function* () {
      var res = yield _this15._get({
        url: "".concat(subredditName ? "r/".concat(subredditName, "/") : '', "random")
      });
      return res instanceof snoowrap.objects.Submission ? res : null;
    })();
  }
  /**
   * @summary Gets a Listing of top posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
   * `hour, day, week, month, year, all`
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getTop({time: 'all', limit: 2}).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... }
   * // ]
   *
   * r.getTop('AskReddit').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   */


  getTop(subredditName, options) {
    return this._getSortedFrontpage('top', subredditName, options);
  }
  /**
   * @summary Gets a Listing of controversial posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
   * `hour, day, week, month, year, all`
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getControversial('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */


  getControversial(subredditName, options) {
    return this._getSortedFrontpage('controversial', subredditName, options);
  }
  /**
   * @summary Gets a Listing of controversial posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getRising('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */


  getRising(subredditName, options) {
    return this._getSortedFrontpage('rising', subredditName, options);
  }
  /**
   * @summary Gets the authenticated user's unread messages.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing unread items in the user's inbox
   * @example
   *
   * r.getUnreadMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */


  getUnreadMessages() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this._getListing({
      uri: 'message/unread',
      qs: options
    });
  }
  /**
   * @summary Gets the items in the authenticated user's inbox.
   * @param {object} [options={}] Filter options. Can also contain options for the resulting Listing.
   * @param {string} [options.filter] A filter for the inbox items. If provided, it should be one of `unread`, (unread
   * items), `messages` (i.e. PMs), `comments` (comment replies), `selfreply` (selfpost replies), or `mentions` (username
   * mentions).
   * @returns {Promise} A Listing containing items in the user's inbox
   * @example
   *
   * r.getInbox().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */


  getInbox() {
    var _ref19 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        filter = _ref19.filter,
        options = _objectWithoutProperties(_ref19, ["filter"]);

    return this._getListing({
      uri: "message/".concat(filter || 'inbox'),
      qs: options
    });
  }
  /**
   * @summary Gets the authenticated user's modmail.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing of the user's modmail
   * @example
   *
   * r.getModmail({limit: 2}).then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: '/u/not_an_aardvark has accepted an invitation to become moderator ... ', ... },
   * //  PrivateMessage { body: '/u/not_an_aardvark has been invited by /u/actually_an_aardvark to ...', ... }
   * // ]
   */


  getModmail() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this._getListing({
      uri: 'message/moderator',
      qs: options
    });
  }
  /**
   * @summary Gets a list of ModmailConversations from the authenticated user's subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise<Listing<ModmailConversation>>} A Listing containing Subreddits
   * @example
   *
   * r.getNewModmailConversations({limit: 2}).then(console.log)
   * // => Listing [
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... },
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   * // ]
   */


  getNewModmailConversations() {
    var _this16 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this._getListing({
      uri: 'api/mod/conversations',
      qs: options,
      _name: 'ModmailConversation',
      _transform: function (response) {
        response.after = null;
        response.before = null;
        response.children = [];

        for (var conversation of response.conversationIds) {
          response.conversations[conversation].participant = _this16._newObject('ModmailConversationAuthor', _objectSpread({}, response.conversations[conversation].participant));

          var conversationObjects = objects.ModmailConversation._getConversationObjects(response.conversations[conversation], response);

          var data = _objectSpread({}, conversationObjects, {}, response.conversations[conversation]);

          response.children.push(_this16._newObject('ModmailConversation', data));
        }

        return _this16._newObject('Listing', response);
      }
    });
  }
  /**
   * @summary Create a new modmail discussion between moderators
   * @param {object} options
   * @param {string} options.body Body of the discussion
   * @param {string} options.subject Title or subject
   * @param {string} options.srName Subreddit name without fullname
   * @returns {Promise<ModmailConversation>} the created ModmailConversation
   * @example
   *
   * r.createModeratorDiscussion({
   *   body: 'test body',
   *   subject: 'test subject',
   *   srName: 'AskReddit'
   * }).then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   */


  createModmailDiscussion(_ref20) {
    var _this17 = this;

    var body = _ref20.body,
        subject = _ref20.subject,
        srName = _ref20.srName;
    return _asyncToGenerator(function* () {
      var parsedFromSr = srName.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'

      var res = yield _this17._post({
        url: 'api/mod/conversations',
        form: {
          body,
          subject,
          srName: parsedFromSr
        }
      }); // _newObject ignores most of the response, no practical way to parse the returned content yet

      return _this17._newObject('ModmailConversation', {
        id: res.conversation.id
      });
    })();
  }
  /**
   * @summary Get a ModmailConversation by its id
   * @param {string} id of the ModmailConversation
   * @returns {Promise<ModmailConversation>} the requested ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], ... }
   */


  getNewModmailConversation(id) {
    return this._newObject('ModmailConversation', {
      id
    });
  }
  /**
   * @summary Marks all conversations in array as read.
   * @param {ModmailConversation[]} conversations to mark as read
   * @example
   *
   * r.markNewModmailConversationsAsRead(['pics', 'sweden'])
   */


  markNewModmailConversationsAsRead(conversations) {
    var conversationIds = conversations.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, '');
    });
    return this._post({
      url: 'api/mod/conversations/read',
      form: {
        conversationIds: conversationIds.join(',')
      }
    });
  }
  /**
   * @summary Marks all conversations in array as unread.
   * @param {ModmailConversation[]} conversations to mark as unread
   * @example
   *
   * r.markNewModmailConversationsAsUnread(['pics', 'sweden'])
   */


  markNewModmailConversationsAsUnread(conversations) {
    var conversationIds = conversations.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, '');
    });
    return this._post({
      url: 'api/mod/conversations/unread',
      form: {
        conversationIds: conversationIds.join(',')
      }
    });
  }
  /**
   * @summary Gets all moderated subreddits that have new Modmail activated
   * @returns {Promise<Listing<Subreddit>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.getNewModmailSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit { display_name: 'tipofmytongue', ... },
   * //  Subreddit { display_name: 'EarthPorn', ... },
   * // ]
   */


  getNewModmailSubreddits() {
    var _this18 = this;

    return _asyncToGenerator(function* () {
      var response = yield _this18._get({
        url: 'api/mod/conversations/subreddits'
      });
      return Object.values(response.subreddits).map(function (s) {
        return _this18._newObject('Subreddit', s);
      });
    })();
  }
  /**
   * @summary Represents the unread count in a {@link ModmailConversation}. Each of these properties
   * correspond to the amount of unread conversations of that type.
   * @typedef {Object} UnreadCount
   * @property {number} highlighted
   * @property {number} notifications
   * @property {number} archived
   * @property {number} new
   * @property {number} inprogress
   * @property {number} mod
   */

  /**
   * @summary Retrieves an object of unread Modmail conversations for each state.
   * @returns {UnreadCount} unreadCount
   * @example
   *
   * r.getUnreadNewModmailConversationsCount().then(console.log)
   * // => {
   * //  archived: 1,
   * //  appeals: 1,
   * //  highlighted: 0,
   * //  notifications: 0,
   * //  join_requests: 0,
   * //  new: 2,
   * //  inprogress: 5,
   * //  mod: 1,
   * // }
   */


  getUnreadNewModmailConversationsCount() {
    return this._get({
      url: 'api/mod/conversations/unread/count'
    });
  }
  /**
   * @summary Mark Modmail conversations as read given the subreddit(s) and state.
   * @param {Subreddit[]|String[]} subreddits
   * @param {('archived'|'appeals'|'highlighted'|'notifications'|'join_requests'|'new'|'inprogress'|'mod'|'all')} state selected state to mark as read
   * @returns {Promise<Listing<ModmailConversation>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.bulkReadNewModmail(['AskReddit'], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   *
   * r.bulkReadNewModmail([r.getSubreddit('AskReddit')], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   */


  bulkReadNewModmail(subreddits, state) {
    var _this19 = this;

    return _asyncToGenerator(function* () {
      var subredditNames = subreddits.map(function (s) {
        return typeof s === 'string' ? s.replace(/^\/?r\//, '') : s.display_name;
      });
      var res = yield _this19._post({
        url: 'api/mod/conversations/bulk/read',
        form: {
          entity: subredditNames.join(','),
          state
        }
      });
      return _this19._newObject('Listing', {
        after: null,
        before: null,
        children: res.conversation_ids.map(function (id) {
          return _this19._newObject('ModmailConversation', {
            id
          });
        })
      });
    })();
  }
  /**
   * @summary Gets the user's sent messages.
   * @param {object} [options={}] options for the resulting Listing
   * @returns {Promise} A Listing of the user's sent messages
   * @example
   *
   * r.getSentMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'you have been added as an approved submitter to ...', ... },
   * //  PrivateMessage { body: 'you have been banned from posting to ...' ... }
   * // ]
   */


  getSentMessages() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this._getListing({
      uri: 'message/sent',
      qs: options
    });
  }
  /**
   * @summary Marks all of the given messages as read.
   * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
   * representing message or comment IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname
   * prefix such as `t1_` is specified.
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsRead(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsRead(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */


  markMessagesAsRead(messages) {
    var messageIds = messages.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, 't4_');
    });
    return this._post({
      url: 'api/read_message',
      form: {
        id: messageIds.join(',')
      }
    });
  }
  /**
   * @summary Marks all of the given messages as unread.
   * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
   * representing message IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname prefix such
   * as `t1_` is included.
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsUnread(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsUnread(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */


  markMessagesAsUnread(messages) {
    var messageIds = messages.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, 't4_');
    });
    return this._post({
      url: 'api/unread_message',
      form: {
        id: messageIds.join(',')
      }
    });
  }
  /**
   * @summary Marks all of the user's messages as read.
   * @desc **Note:** The reddit.com site imposes a ratelimit of approximately 1 request every 10 minutes on this endpoint.
   * Further requests will cause the API to return a 429 error.
   * @returns {Promise} A Promise that resolves when the request is complete
   * @example
   *
   * r.readAllMessages().then(function () {
   *   r.getUnreadMessages().then(console.log)
   * })
   * // => Listing []
   * // (messages marked as 'read' on reddit)
   */


  readAllMessages() {
    return this._post({
      url: 'api/read_all_messages'
    });
  }
  /**
   * @summary Composes a new private message.
   * @param {object} options
   * @param {RedditUser|Subreddit|string} options.to The recipient of the message.
   * @param {string} options.subject The message subject (100 characters max)
   * @param {string} options.text The body of the message, in raw markdown text
   * @param {Subreddit|string} [options.fromSubreddit] If provided, the message is sent as a modmail from the specified
   * subreddit.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.composeMessage({
   *   to: 'actually_an_aardvark',
   *   subject: "Hi, how's it going?",
   *   text: 'Long time no see'
   * })
   * // (message created on reddit)
   */


  composeMessage(_ref21) {
    var _this20 = this;

    var captcha = _ref21.captcha,
        from_subreddit = _ref21.from_subreddit,
        _ref21$fromSubreddit = _ref21.fromSubreddit,
        fromSubreddit = _ref21$fromSubreddit === void 0 ? from_subreddit : _ref21$fromSubreddit,
        captcha_iden = _ref21.captcha_iden,
        _ref21$captchaIden = _ref21.captchaIden,
        captchaIden = _ref21$captchaIden === void 0 ? captcha_iden : _ref21$captchaIden,
        subject = _ref21.subject,
        text = _ref21.text,
        to = _ref21.to;
    return _asyncToGenerator(function* () {
      var parsedTo = to;
      var parsedFromSr = fromSubreddit;

      if (to instanceof snoowrap.objects.RedditUser) {
        parsedTo = to.name;
      } else if (to instanceof snoowrap.objects.Subreddit) {
        parsedTo = "/r/".concat(to.display_name);
      }

      if (fromSubreddit instanceof snoowrap.objects.Subreddit) {
        parsedFromSr = fromSubreddit.display_name;
      } else if (typeof fromSubreddit === 'string') {
        parsedFromSr = fromSubreddit.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
      }

      var result = yield _this20._post({
        url: 'api/compose',
        form: {
          api_type,
          captcha,
          iden: captchaIden,
          from_sr: parsedFromSr,
          subject,
          text,
          to: parsedTo
        }
      });
      (0, _helpers.handleJsonErrors)(result);
      return {};
    })();
  }
  /**
   * @summary Gets a list of all oauth scopes supported by the reddit API.
   * @desc **Note**: This lists every single oauth scope. To get the scope of this requester, use the `scope` property instead.
   * @returns {Promise} An object containing oauth scopes.
   * @example
   *
   * r.getOauthScopeList().then(console.log)
   * // => {
   * //  creddits: {
   * //    description: 'Spend my reddit gold creddits on giving gold to other users.',
   * //    id: 'creddits',
   * //    name: 'Spend reddit gold creddits'
   * //  },
   * //  modcontributors: {
   * //    description: 'Add/remove users to approved submitter lists and ban/unban or mute/unmute users from ...',
   * //    id: 'modcontributors',
   * //    name: 'Approve submitters and ban users'
   * //  },
   * //  ...
   * // }
   */


  getOauthScopeList() {
    return this._get({
      url: 'api/v1/scopes'
    });
  }
  /**
   * @summary Conducts a search of reddit submissions.
   * @param {object} options Search options. Can also contain options for the resulting Listing.
   * @param {string} options.query The search query
   * @param {string} [options.time] Describes the timespan that posts should be retrieved from. One of
   * `hour, day, week, month, year, all`
   * @param {Subreddit|string} [options.subreddit] The subreddit to conduct the search on.
   * @param {boolean} [options.restrictSr=true] Restricts search results to the given subreddit
   * @param {string} [options.sort] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
   * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
   * @returns {Promise} A Listing containing the search results.
   * @example
   *
   * r.search({
   *   query: 'Cute kittens',
   *   subreddit: 'aww',
   *   sort: 'top'
   * }).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, ... },
   * //  ...
   * // ]
   */


  search(options) {
    if (options.subreddit instanceof snoowrap.objects.Subreddit) {
      options.subreddit = options.subreddit.display_name;
    }

    (0, _lodash.defaults)(options, {
      restrictSr: true,
      syntax: 'plain'
    });
    var parsedQuery = (0, _lodash.omit)(_objectSpread({}, options, {
      t: options.time,
      q: options.query,
      restrict_sr: options.restrictSr
    }), ['time', 'query']);
    return this._getListing({
      uri: "".concat(options.subreddit ? "r/".concat(options.subreddit, "/") : '', "search"),
      qs: parsedQuery
    });
  }
  /**
   * @summary Searches for subreddits given a query.
   * @param {object} options
   * @param {string} options.query A search query (50 characters max)
   * @param {boolean} [options.exact=false] Determines whether the results shouldbe limited to exact matches.
   * @param {boolean} [options.includeNsfw=true] Determines whether the results should include NSFW subreddits.
   * @returns {Promise} An Array containing subreddit names
   * @example
   *
   * r.searchSubredditNames({query: 'programming'}).then(console.log)
   * // => [
   * //  'programming',
   * //  'programmingcirclejerk',
   * //  'programminghorror',
   * //  ...
   * // ]
   */


  searchSubredditNames(_ref22) {
    var _this21 = this;

    var _ref22$exact = _ref22.exact,
        exact = _ref22$exact === void 0 ? false : _ref22$exact,
        _ref22$include_nsfw = _ref22.include_nsfw,
        include_nsfw = _ref22$include_nsfw === void 0 ? true : _ref22$include_nsfw,
        _ref22$includeNsfw = _ref22.includeNsfw,
        includeNsfw = _ref22$includeNsfw === void 0 ? include_nsfw : _ref22$includeNsfw,
        query = _ref22.query;
    return _asyncToGenerator(function* () {
      var res = yield _this21._post({
        url: 'api/search_reddit_names',
        params: {
          exact,
          include_over_18: includeNsfw,
          query
        }
      });
      return res.names;
    })();
  }

  _createOrEditSubreddit(_ref23) {
    var _this22 = this;

    var _ref23$allow_images = _ref23.allow_images,
        allow_images = _ref23$allow_images === void 0 ? true : _ref23$allow_images,
        _ref23$allow_top = _ref23.allow_top,
        allow_top = _ref23$allow_top === void 0 ? true : _ref23$allow_top,
        captcha = _ref23.captcha,
        captcha_iden = _ref23.captcha_iden,
        _ref23$collapse_delet = _ref23.collapse_deleted_comments,
        collapse_deleted_comments = _ref23$collapse_delet === void 0 ? false : _ref23$collapse_delet,
        _ref23$comment_score_ = _ref23.comment_score_hide_mins,
        comment_score_hide_mins = _ref23$comment_score_ === void 0 ? 0 : _ref23$comment_score_,
        description = _ref23.description,
        _ref23$exclude_banned = _ref23.exclude_banned_modqueue,
        exclude_banned_modqueue = _ref23$exclude_banned === void 0 ? false : _ref23$exclude_banned,
        header_title = _ref23['header-title'],
        _ref23$hide_ads = _ref23.hide_ads,
        hide_ads = _ref23$hide_ads === void 0 ? false : _ref23$hide_ads,
        _ref23$lang = _ref23.lang,
        lang = _ref23$lang === void 0 ? 'en' : _ref23$lang,
        _ref23$link_type = _ref23.link_type,
        link_type = _ref23$link_type === void 0 ? 'any' : _ref23$link_type,
        name = _ref23.name,
        _ref23$over_ = _ref23.over_18,
        over_18 = _ref23$over_ === void 0 ? false : _ref23$over_,
        public_description = _ref23.public_description,
        _ref23$public_traffic = _ref23.public_traffic,
        public_traffic = _ref23$public_traffic === void 0 ? false : _ref23$public_traffic,
        _ref23$show_media = _ref23.show_media,
        show_media = _ref23$show_media === void 0 ? false : _ref23$show_media,
        _ref23$show_media_pre = _ref23.show_media_preview,
        show_media_preview = _ref23$show_media_pre === void 0 ? true : _ref23$show_media_pre,
        _ref23$spam_comments = _ref23.spam_comments,
        spam_comments = _ref23$spam_comments === void 0 ? 'high' : _ref23$spam_comments,
        _ref23$spam_links = _ref23.spam_links,
        spam_links = _ref23$spam_links === void 0 ? 'high' : _ref23$spam_links,
        _ref23$spam_selfposts = _ref23.spam_selfposts,
        spam_selfposts = _ref23$spam_selfposts === void 0 ? 'high' : _ref23$spam_selfposts,
        _ref23$spoilers_enabl = _ref23.spoilers_enabled,
        spoilers_enabled = _ref23$spoilers_enabl === void 0 ? false : _ref23$spoilers_enabl,
        sr = _ref23.sr,
        _ref23$submit_link_la = _ref23.submit_link_label,
        submit_link_label = _ref23$submit_link_la === void 0 ? '' : _ref23$submit_link_la,
        _ref23$submit_text_la = _ref23.submit_text_label,
        submit_text_label = _ref23$submit_text_la === void 0 ? '' : _ref23$submit_text_la,
        _ref23$submit_text = _ref23.submit_text,
        submit_text = _ref23$submit_text === void 0 ? '' : _ref23$submit_text,
        _ref23$suggested_comm = _ref23.suggested_comment_sort,
        suggested_comment_sort = _ref23$suggested_comm === void 0 ? 'confidence' : _ref23$suggested_comm,
        title = _ref23.title,
        _ref23$type = _ref23.type,
        type = _ref23$type === void 0 ? 'public' : _ref23$type,
        wiki_edit_age = _ref23.wiki_edit_age,
        wiki_edit_karma = _ref23.wiki_edit_karma,
        _ref23$wikimode = _ref23.wikimode,
        wikimode = _ref23$wikimode === void 0 ? 'modonly' : _ref23$wikimode,
        otherKeys = _objectWithoutProperties(_ref23, ["allow_images", "allow_top", "captcha", "captcha_iden", "collapse_deleted_comments", "comment_score_hide_mins", "description", "exclude_banned_modqueue", "header-title", "hide_ads", "lang", "link_type", "name", "over_18", "public_description", "public_traffic", "show_media", "show_media_preview", "spam_comments", "spam_links", "spam_selfposts", "spoilers_enabled", "sr", "submit_link_label", "submit_text_label", "submit_text", "suggested_comment_sort", "title", "type", "wiki_edit_age", "wiki_edit_karma", "wikimode"]);

    return _asyncToGenerator(function* () {
      var res = yield _this22._post({
        url: 'api/site_admin',
        form: _objectSpread({
          allow_images,
          allow_top,
          api_type,
          captcha,
          collapse_deleted_comments,
          comment_score_hide_mins,
          description,
          exclude_banned_modqueue,
          'header-title': header_title,
          hide_ads,
          iden: captcha_iden,
          lang,
          link_type,
          name,
          over_18,
          public_description,
          public_traffic,
          show_media,
          show_media_preview,
          spam_comments,
          spam_links,
          spam_selfposts,
          spoilers_enabled,
          sr,
          submit_link_label,
          submit_text,
          submit_text_label,
          suggested_comment_sort,
          title,
          type,
          wiki_edit_age,
          wiki_edit_karma,
          wikimode
        }, otherKeys)
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this22.getSubreddit(name || sr);
    })();
  }
  /**
   * @summary Creates a new subreddit.
   * @param {object} options
   * @param {string} options.name The name of the new subreddit
   * @param {string} options.title The text that should appear in the header of the subreddit
   * @param {string} options.public_description The text that appears with this subreddit on the search page, or on the
   * blocked-access page if this subreddit is private. (500 characters max)
   * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
   * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
   * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only
   * allowed for gold-only subreddits.)
   * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
   * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of
   * `public, private, restricted, gold_restricted, gold_only, archived, employees_only`.
   * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should
   * be one of `any, link, self`.
   * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If
   * this is omitted, the default text will be displayed.
   * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If
   * this is omitted, the default text will be displayed.
   * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of
   * `modonly, anyone, disabled`.
   * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this
   * subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
   * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's
   * wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
   * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of
   * `low, high, all`.
   * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be
   * one of `low, high, all`.
   * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one
   * of `low, high, all`.
   * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW
   * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and
   * trending subreddits
   * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit
   * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this
   * subreddit
   * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be
   * enabled on this subreddit
   * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
   * excluded from the modqueue.
   * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
   * viewable by anyone.
   * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
   * collapsed by default
   * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
   * one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort,
   * which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
   * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
   * @returns {Promise} A Promise for the newly-created subreddit object.
   * @example
   *
   * r.createSubreddit({
   *   name: 'snoowrap_testing2',
   *   title: 'snoowrap testing: the sequel',
   *   public_description: 'thanks for reading the snoowrap docs!',
   *   description: 'This text will go on the sidebar',
   *   type: 'private'
   * }).then(console.log)
   * // => Subreddit { display_name: 'snoowrap_testing2' }
   * // (/r/snoowrap_testing2 created on reddit)
   */


  createSubreddit(options) {
    return this._createOrEditSubreddit(options);
  }
  /**
   * @summary Searches subreddits by topic.
   * @param {object} options
   * @param {string} options.query The search query. (50 characters max)
   * @returns {Promise} An Array of subreddit objects corresponding to the search results
   * @deprecated Reddit no longer provides the corresponding API endpoint.
   * @example
   *
   * r.searchSubredditTopics({query: 'movies'}).then(console.log)
   * // => [
   * //  Subreddit { display_name: 'tipofmytongue' },
   * //  Subreddit { display_name: 'remove' },
   * //  Subreddit { display_name: 'horror' },
   * //  ...
   * // ]
   */


  searchSubredditTopics(_ref24) {
    var _this23 = this;

    var query = _ref24.query;
    return _asyncToGenerator(function* () {
      var results = yield _this23._get({
        url: 'api/subreddits_by_topic',
        params: {
          query
        }
      });
      return results.map(function (result) {
        return _this23.getSubreddit(result.name);
      });
    })();
  }
  /**
   * @summary Gets a list of subreddits that the currently-authenticated user is subscribed to.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getSubscriptions({limit: 2}).then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'gadgets',
   * //    title: 'reddit gadget guide',
   * //    ...
   * //  },
   * //  Subreddit {
   * //    display_name: 'sports',
   * //    title: 'the sportspage of the Internet',
   * //    ...
   * //  }
   * // ]
   */


  getSubscriptions(options) {
    return this._getListing({
      uri: 'subreddits/mine/subscriber',
      qs: options
    });
  }
  /**
   * @summary Gets a list of subreddits in which the currently-authenticated user is an approved submitter.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getContributorSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   *
   */


  getContributorSubreddits(options) {
    return this._getListing({
      uri: 'subreddits/mine/contributor',
      qs: options
    });
  }
  /**
   * @summary Gets a list of subreddits in which the currently-authenticated user is a moderator.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getModeratedSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   */


  getModeratedSubreddits(options) {
    return this._getListing({
      uri: 'subreddits/mine/moderator',
      qs: options
    });
  }
  /**
   * @summary Searches subreddits by title and description.
   * @param {object} options Options for the search. May also contain Listing parameters.
   * @param {string} options.query The search query
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.searchSubreddits({query: 'cookies'}).then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */


  searchSubreddits(options) {
    options.q = options.query;
    return this._getListing({
      uri: 'subreddits/search',
      qs: (0, _lodash.omit)(options, 'query')
    });
  }
  /**
   * @summary Gets a list of subreddits, arranged by popularity.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getPopularSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */


  getPopularSubreddits(options) {
    return this._getListing({
      uri: 'subreddits/popular',
      qs: options
    });
  }
  /**
   * @summary Gets a list of subreddits, arranged by age.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getNewSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */


  getNewSubreddits(options) {
    return this._getListing({
      uri: 'subreddits/new',
      qs: options
    });
  }
  /**
   * @summary Gets a list of gold-exclusive subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getGoldSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */


  getGoldSubreddits(options) {
    return this._getListing({
      uri: 'subreddits/gold',
      qs: options
    });
  }
  /**
   * @summary Gets a list of default subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getDefaultSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */


  getDefaultSubreddits(options) {
    return this._getListing({
      uri: 'subreddits/default',
      qs: options
    });
  }
  /**
   * @summary Checks whether a given username is available for registration
   * @desc **Note:** This function will not work when snoowrap is running in a browser, due to an issue with reddit's CORS
   * settings.
   * @param {string} name The username in question
   * @returns {Promise} A Promise that fulfills with a Boolean (`true` or `false`)
   * @example
   *
   * r.checkUsernameAvailability('not_an_aardvark').then(console.log)
   * // => false
   * r.checkUsernameAvailability('eqwZAr9qunx7IHqzWVeF').then(console.log)
   * // => true
   */


  checkUsernameAvailability(name) {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return this.unauthenticatedRequest({
      url: 'api/username_available.json',
      params: {
        user: name
      }
    });
  }
  /**
   * @summary Creates a new LiveThread.
   * @param {object} options
   * @param {string} options.title The title of the livethread (100 characters max)
   * @param {string} [options.description] A descriptions of the thread. 120 characters max
   * @param {string} [options.resources] Information and useful links related to the thread. 120 characters max
   * @param {boolean} [options.nsfw=false] Determines whether the thread is Not Safe For Work
   * @returns {Promise} A Promise that fulfills with the new LiveThread when the request is complete
   * @example
   *
   * r.createLivethread({title: 'My livethread'}).then(console.log)
   * // => LiveThread { id: 'wpimncm1f01j' }
   */


  createLivethread(_ref25) {
    var _this24 = this;

    var title = _ref25.title,
        description = _ref25.description,
        resources = _ref25.resources,
        _ref25$nsfw = _ref25.nsfw,
        nsfw = _ref25$nsfw === void 0 ? false : _ref25$nsfw;
    return _asyncToGenerator(function* () {
      var result = yield _this24._post({
        url: 'api/live/create',
        form: {
          api_type,
          description,
          nsfw,
          resources,
          title
        }
      });
      (0, _helpers.handleJsonErrors)(result);
      return _this24.getLivethread(result.json.data.id);
    })();
  }
  /**
   * @summary Gets the "happening now" LiveThread, if it exists
   * @desc This is the LiveThread that is occasionally linked at the top of reddit.com, relating to current events.
   * @returns {Promise} A Promise that fulfills with the "happening now" LiveThread if it exists, or rejects with a 404 error
   * otherwise.
   * @example r.getCurrentEventsLivethread().then(thread => thread.stream.on('update', console.log))
   */


  getStickiedLivethread() {
    return this._get({
      url: 'api/live/happening_now'
    });
  }
  /**
   * @summary Gets the user's own multireddits.
   * @returns {Promise} A Promise for an Array containing the requester's MultiReddits.
   * @example
   *
   * r.getMyMultireddits().then(console.log)
   * => [ MultiReddit { ... }, MultiReddit { ... }, ... ]
   */


  getMyMultireddits() {
    return this._get({
      url: 'api/multi/mine',
      params: {
        expand_srs: true
      }
    });
  }
  /**
   * @summary Creates a new multireddit.
   * @param {object} options
   * @param {string} options.name The name of the new multireddit. 50 characters max
   * @param {string} options.description A description for the new multireddit, in markdown.
   * @param {Array} options.subreddits An Array of Subreddit objects (or subreddit names) that this multireddit should compose of
   * @param {string} [options.visibility='private'] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
   * @param {string} [options.icon_name=''] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`,
   * `cute animals`, `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`,
   * `models pinup`, `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`,
   * `travel`, `unusual stories`, `video`, `None`
   * @param {string} [options.key_color='#000000'] A six-digit RGB hex color, preceded by '#'
   * @param {string} [options.weighting_scheme='classic'] One of `classic`, `fresh`
   * @returns {Promise} A Promise for the newly-created MultiReddit object
   * @example
   *
   * r.createMultireddit({
   *   name: 'myMulti',
   *   description: 'An example multireddit',
   *   subreddits: ['snoowrap', 'snoowrap_testing']
   * }).then(console.log)
   * => MultiReddit { display_name: 'myMulti', ... }
   */


  createMultireddit(_ref26) {
    var name = _ref26.name,
        description = _ref26.description,
        subreddits = _ref26.subreddits,
        _ref26$visibility = _ref26.visibility,
        visibility = _ref26$visibility === void 0 ? 'private' : _ref26$visibility,
        _ref26$icon_name = _ref26.icon_name,
        icon_name = _ref26$icon_name === void 0 ? '' : _ref26$icon_name,
        _ref26$key_color = _ref26.key_color,
        key_color = _ref26$key_color === void 0 ? '#000000' : _ref26$key_color,
        _ref26$weighting_sche = _ref26.weighting_scheme,
        weighting_scheme = _ref26$weighting_sche === void 0 ? 'classic' : _ref26$weighting_sche;
    return this._post({
      url: 'api/multi',
      form: {
        model: JSON.stringify({
          display_name: name,
          description_md: description,
          icon_name,
          key_color,
          subreddits: subreddits.map(function (sub) {
            return {
              name: typeof sub === 'string' ? sub : sub.display_name
            };
          }),
          visibility,
          weighting_scheme
        })
      }
    });
  }

  _revokeToken(token) {
    return this.credentialedClientRequest({
      url: 'api/v1/revoke_token',
      form: {
        token
      },
      method: 'post'
    });
  }
  /**
   * @summary Invalidates the current access token.
   * @returns {Promise} A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the
   * current requester was supplied with a refresh token, it will automatically create a new access token if any more requests
   * are made after this one.
   * @example r.revokeAccessToken();
   */


  revokeAccessToken() {
    var _this25 = this;

    return _asyncToGenerator(function* () {
      yield _this25._revokeToken(_this25.accessToken);
      _this25.accessToken = null;
      _this25.tokenExpiration = null;
      _this25.scope = null;
    })();
  }
  /**
   * @summary Invalidates the current refresh token.
   * @returns {Promise} A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. All
   * access tokens generated by this refresh token will also be invalidated. This effectively de-authenticates the requester and
   * prevents it from making any more valid requests. This should only be used in a few cases, e.g. if this token has
   * been accidentally leaked to a third party.
   * @example r.revokeRefreshToken();
   */


  revokeRefreshToken() {
    var _this26 = this;

    return _asyncToGenerator(function* () {
      yield _this26._revokeToken(_this26.refreshToken);
      _this26.refreshToken = null;
      _this26.accessToken = null; // Revoking a refresh token also revokes any associated access tokens.

      _this26.tokenExpiration = null;
      _this26.scope = null;
    })();
  }

  _selectFlair(_ref27) {
    var _this27 = this;

    var flair_template_id = _ref27.flair_template_id,
        link = _ref27.link,
        name = _ref27.name,
        text = _ref27.text,
        subredditName = _ref27.subredditName;
    return _asyncToGenerator(function* () {
      if (!flair_template_id) {
        throw new errors.InvalidMethodCallError('No flair template ID provided');
      }

      return _this27._post({
        url: "r/".concat(subredditName, "/api/selectflair"),
        form: {
          api_type,
          flair_template_id,
          link,
          name,
          text
        }
      });
    })();
  }

  _assignFlair(_ref28) {
    var _this28 = this;

    var css_class = _ref28.css_class,
        _ref28$cssClass = _ref28.cssClass,
        cssClass = _ref28$cssClass === void 0 ? css_class : _ref28$cssClass,
        link = _ref28.link,
        name = _ref28.name,
        text = _ref28.text,
        subreddit_name = _ref28.subreddit_name,
        _ref28$subredditName = _ref28.subredditName,
        subredditName = _ref28$subredditName === void 0 ? subreddit_name : _ref28$subredditName;
    return _asyncToGenerator(function* () {
      return _this28._post({
        url: "r/".concat(subredditName, "/api/flair"),
        form: {
          api_type,
          name,
          text,
          link,
          css_class: cssClass
        }
      });
    })();
  }

  _populate(responseTree) {
    var _this29 = this;

    var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var nested = arguments.length > 2 ? arguments[2] : undefined;

    if (typeof responseTree === 'object' && responseTree !== null) {
      // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
      if (Object.keys(responseTree).length === 2 && responseTree.kind && responseTree.data) {
        var populated = this._newObject(_constants.KINDS[responseTree.kind] || 'RedditContent', this._populate(responseTree.data, children, true), true);

        if (!nested && Object.keys(children).length) {
          populated._children = children;
        }

        if (populated instanceof snoowrap.objects.Comment) {
          children[populated.id] = populated;
        }

        return populated;
      }

      var result = (Array.isArray(responseTree) ? _lodash.map : _lodash.mapValues)(responseTree, function (value, key) {
        // Maps {author: 'some_username'} to {author: RedditUser { name: 'some_username' } }
        if (value !== null && _constants.USER_KEYS.has(key)) {
          return _this29._newObject('RedditUser', {
            name: value
          });
        }

        if (value !== null && _constants.SUBREDDIT_KEYS.has(key)) {
          return _this29._newObject('Subreddit', {
            display_name: value
          });
        }

        return _this29._populate(value, children, true);
      });

      if (result.length === 2 && result[0] instanceof snoowrap.objects.Listing && result[0][0] instanceof snoowrap.objects.Submission && result[1] instanceof snoowrap.objects.Listing) {
        if (result[1]._more && !result[1]._more.link_id) {
          result[1]._more.link_id = result[0][0].name;
        }

        result[0][0].comments = result[1];
        result[0][0]._children = children;
        return result[0][0];
      }

      if (!nested && Object.keys(children).length) {
        result._children = children;
      }

      return result;
    }

    return responseTree;
  }

  _getListing(_ref29) {
    var uri = _ref29.uri,
        _ref29$qs = _ref29.qs,
        qs = _ref29$qs === void 0 ? {} : _ref29$qs,
        options = _objectWithoutProperties(_ref29, ["uri", "qs"]);

    /**
     * When the response type is expected to be a Listing, add a `count` parameter with a very high number.
     * This ensures that reddit returns a `before` property in the resulting Listing to enable pagination.
     * (Aside from the additional parameter, this function is equivalent to snoowrap.prototype._get)
     */
    var mergedQuery = _objectSpread({
      count: 9999
    }, qs);

    return qs.limit || !(0, _lodash.isEmpty)(options) ? this._newObject('Listing', _objectSpread({
      _query: mergedQuery,
      _uri: uri
    }, options)).fetchMore(qs.limit || _constants.MAX_LISTING_ITEMS)
    /**
     * This second case is used as a fallback in case the endpoint unexpectedly ends up returning something other than a
     * Listing (e.g. Submission#getRelated, which used to return a Listing but no longer does due to upstream reddit API
     * changes), in which case using fetch_more() as above will throw an error.
     *
     * This fallback only works if there are no other meta-properties provided for the Listing, such as _transform. If there are
     * other meta-properties,  the function will still end up throwing an error, but there's not really any good way to handle it
     * (predicting upstream changes can only go so far). More importantly, in the limited cases where it's used, the fallback
     * should have no effect on the returned results
     */
    : this._get({
      url: uri,
      params: mergedQuery
    }).then(function (listing) {
      if (Array.isArray(listing)) {
        listing.filter(function (item) {
          return item.constructor._name === 'Comment';
        }).forEach(_helpers.addEmptyRepliesListing);
      }

      return listing;
    });
  }
  /**
   * @summary In browsers, restores the `window.snoowrap` property to whatever it was before this instance of snoowrap was
   * loaded. This is a no-op in Node.
   * @returns This instance of the snoowrap constructor
   * @example var snoowrap = window.snoowrap.noConflict();
   */


  static noConflict() {
    if (_helpers.isBrowser) {
      global[_constants.MODULE_NAME] = this._previousSnoowrap;
    }

    return this;
  }

};

function identity(value) {
  return value;
}

(0, _helpers.defineInspectFunc)(snoowrap.prototype, function () {
  // Hide confidential information (tokens, client IDs, etc.), as well as private properties, from the console.log output.
  var keysForHiddenValues = ['clientSecret', 'refreshToken', 'accessToken', 'password'];
  var formatted = (0, _lodash.mapValues)((0, _lodash.omitBy)(this, function (value, key) {
    return typeof key === 'string' && key.startsWith('_');
  }), function (value, key) {
    return (0, _lodash.includes)(keysForHiddenValues, key) ? value && '(redacted)' : value;
  });
  return "".concat(_constants.MODULE_NAME, " ").concat(_util.default.inspect(formatted));
});
var classFuncDescriptors = {
  configurable: true,
  writable: true
};
/**
 * Add the request_handler functions (oauth_request, credentialed_client_request, etc.) to the snoowrap prototype. Use
 * Object.defineProperties to ensure that the properties are non-enumerable.
 */

Object.defineProperties(snoowrap.prototype, (0, _lodash.mapValues)(requestHandler, function (func) {
  return _objectSpread({
    value: func
  }, classFuncDescriptors);
}));

_constants.HTTP_VERBS.forEach(function (method) {
  /**
   * Define method shortcuts for each of the HTTP verbs. i.e. `snoowrap.prototype._post` is the same as `oauth_request` except
   * that the HTTP method defaults to `post`, and the result is promise-wrapped. Use Object.defineProperty to ensure that the
   * properties are non-enumerable.
   */
  Object.defineProperty(snoowrap.prototype, "_".concat(method), _objectSpread({
    value(options) {
      return this.oauthRequest(_objectSpread({}, options, {
        method
      }));
    }

  }, classFuncDescriptors));
});
/**
 * `objects` will be an object containing getters for each content type, due to the way objects are exported from
 * objects/index.js. To unwrap these getters into direct properties, use lodash.mapValues with an identity function.
 */


snoowrap.objects = (0, _lodash.mapValues)(objects, identity);
(0, _lodash.forOwn)(_constants.KINDS, function (value) {
  snoowrap.objects[value] = snoowrap.objects[value] || class extends objects.RedditContent {};
  Object.defineProperty(snoowrap.objects[value], '_name', {
    value,
    configurable: true
  });
}); // Alias all functions on snoowrap's prototype and snoowrap's object prototypes in snake_case.

(0, _lodash.values)(snoowrap.objects).concat(snoowrap).map(function (func) {
  return func.prototype;
}).forEach(function (funcProto) {
  Object.getOwnPropertyNames(funcProto).filter(function (name) {
    return !name.startsWith('_') && name !== (0, _lodash.snakeCase)(name) && typeof funcProto[name] === 'function';
  }).forEach(function (name) {
    return Object.defineProperty(funcProto, (0, _lodash.snakeCase)(name), _objectSpread({
      value: funcProto[name]
    }, classFuncDescriptors));
  });
});
snoowrap.errors = errors;
snoowrap.version = _constants.VERSION;

if (!module.parent && _helpers.isBrowser) {
  // check if the code is being run in a browser through browserify, etc.
  snoowrap._previousSnoowrap = global[_constants.MODULE_NAME];
  global[_constants.MODULE_NAME] = snoowrap;
}

module.exports = snoowrap;