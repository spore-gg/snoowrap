"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = require("events");

var _helpers = require("../helpers.js");

var _RedditContent = _interopRequireDefault(require("./RedditContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var WebSocket = _helpers.isBrowser ? global.WebSocket : require('ws');
var api_type = 'json';
/**
 * A class representing a live reddit thread
 * <style> #LiveThread {display: none} </style>
 * @example
 *
 * // Get a livethread with the given ID
 * r.getLivethread('whrdxo8dg9n0')
 * @desc For the most part, reddit distributes the content of live threads via websocket, rather than through the REST API.
 * As such, snoowrap assigns each fetched LiveThread object a `stream` property, which takes the form of an
 * [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). To listen for new thread updates, simply
 * add listeners to that emitter.
 *
 * The following events can be emitted:
 * - `update`: Occurs when a new update has been posted in this thread. Emits a `LiveUpdate` object containing information
 * about the new update.
 * - `activity`: Occurs periodically when the viewer count for this thread changes.
 * - `settings`: Occurs when the thread's settings change. Emits an object containing the new settings.
 * - `delete`: Occurs when an update has been deleted. Emits the ID of the deleted update.
 * - `strike`: Occurs when an update has been striken (marked incorrect and crossed out). Emits the ID of the striken update.
 * - `embeds_ready`: Occurs when embedded media is now available for a previously-posted update.
 * - `complete`: Occurs when this LiveThread has been marked as complete, and no more updates will be sent.
 *
 * (Note: These event types are mapped directly from reddit's categorization of the updates. The descriptions above are
 * paraphrased from reddit's descriptions [here](https://www.reddit.com/dev/api#section_live).)
 *
 * As an example, this would log all new livethread updates to the console:
 *
 * ```javascript
 * someLivethread.stream.on('update', data => {
 *   console.log(data.body);
 * });
 * ```
 *
 * @extends RedditContent
 */

var LiveThread = class LiveThread extends _RedditContent.default {
  constructor(options, _r, _hasFetched) {
    var _this;

    super(options, _r, _hasFetched);
    _this = this;
    this._rawStream = null;
    this._populatedStream = null;

    if (_hasFetched) {
      Object.defineProperty(this, 'stream', {
        get: function () {
          if (!_this._populatedStream && _this.websocket_url) {
            _this._setupWebSocket();
          }

          return _this._populatedStream;
        }
      });
    }
  }

  get _uri() {
    return "live/".concat(this.id, "/about");
  }

  _setupWebSocket() {
    var _this2 = this;

    this._rawStream = new WebSocket(this.websocket_url);
    this._populatedStream = new _events.EventEmitter();

    var handler = function (data) {
      var parsed = _this2._r._populate(JSON.parse(data));

      _this2._populatedStream.emit(parsed.type, parsed.payload);
    };

    if (typeof this._rawStream.on === 'function') {
      this._rawStream.on('message', handler);
    } else {
      this._rawStream.onmessage = function (messageEvent) {
        return handler(messageEvent.data);
      };
    }
  }
  /**
   * @summary Adds a new update to this thread.
   * @param {string} body The body of the new update
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').addUpdate('Breaking: Someone is reading the snoowrap documentation \\o/')
   */


  addUpdate(body) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var res = yield _this3._post({
        url: "api/live/".concat(_this3.id, "/update"),
        form: {
          api_type,
          body
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this3;
    })();
  }
  /**
   * @summary Strikes (marks incorrect and crosses out) the given update.
   * @param {object} options
   * @param {string} options.id The ID of the update that should be striked.
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').strikeUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
   */


  strikeUpdate(_ref) {
    var _this4 = this;

    var id = _ref.id;
    return _asyncToGenerator(function* () {
      var res = yield _this4._post({
        url: "api/live/".concat(_this4.id, "/strike_update"),
        form: {
          api_type,
          id: "".concat(id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_').concat(id)
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this4;
    })();
  }
  /**
   * @summary Deletes an update from this LiveThread.
   * @param {object} options
   * @param {string} options.id The ID of the LiveUpdate that should be deleted
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').deleteUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
   */


  deleteUpdate(_ref2) {
    var _this5 = this;

    var id = _ref2.id;
    return _asyncToGenerator(function* () {
      var res = yield _this5._post({
        url: "api/live/".concat(_this5.id, "/delete_update"),
        form: {
          api_type,
          id: "".concat(id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_').concat(id)
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this5;
    })();
  }
  /**
   * @summary Gets a list of this LiveThread's contributors
   * @returns {Promise} An Array containing RedditUsers
   * @example
   *
   * r.getLivethread('whrdxo8dg9n0').getContributors().then(console.log)
   * // => [
   * //  RedditUser { permissions: ['edit'], name: 'not_an_aardvark', id: 't2_k83md' },
   * //  RedditUser { permissions: ['all'], id: 't2_u3l80', name: 'snoowrap_testing' }
   * // ]
   */


  getContributors() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      var contributors = yield _this6._get({
        url: "live/".concat(_this6.id, "/contributors")
      });
      return Array.isArray(contributors[0]) ? contributors[0] : contributors;
    })();
  }
  /**
   * @summary Invites a contributor to this LiveThread.
   * @param {object} options
   * @param {string} options.name The name of the user who should be invited
   * @param {Array} options.permissions The permissions that the invited user should receive. This should be an Array containing
   * some combination of `'update', 'edit', 'manage'`. To invite a contributor with full permissions, omit this property.
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').inviteContributor({name: 'actually_an_aardvark', permissions: ['update']})
   */


  inviteContributor(_ref3) {
    var _this7 = this;

    var name = _ref3.name,
        permissions = _ref3.permissions;
    return _asyncToGenerator(function* () {
      var res = yield _this7._post({
        url: "api/live/".concat(_this7.id, "/invite_contributor"),
        form: {
          api_type,
          name,
          permissions: (0, _helpers.formatLivethreadPermissions)(permissions),
          type: 'liveupdate_contributor_invite'
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this7;
    })();
  }
  /**
   * @summary Revokes an invitation for the given user to become a contributor on this LiveThread.
   * @param {object} options
   * @param {string} options.name The username of the account whose invitation should be revoked
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').revokeContributorInvite({name: 'actually_an_aardvark'});
   */


  revokeContributorInvite(_ref4) {
    var _this8 = this;

    var name = _ref4.name;
    return _asyncToGenerator(function* () {
      var userId = (yield _this8._r.getUser(name).fetch()).id;
      var res = yield _this8._post({
        url: "api/live/".concat(_this8.id, "/rm_contributor_invite"),
        form: {
          api_type,
          id: "t2_".concat(userId)
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this8;
    })();
  }
  /**
   * @summary Accepts a pending contributor invitation on this LiveThread.
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').acceptContributorInvite()
   */


  acceptContributorInvite() {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      yield _this9._post({
        url: "api/live/".concat(_this9.id, "/accept_contributor_invite"),
        form: {
          api_type
        }
      });
      return _this9;
    })();
  }
  /**
   * @summary Abdicates contributor status on this LiveThread.
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').leaveContributor()
   */


  leaveContributor() {
    var _this10 = this;

    return _asyncToGenerator(function* () {
      yield _this10._post({
        url: "api/live/".concat(_this10.id, "/leave_contributor"),
        form: {
          api_type
        }
      });
      return _this10;
    })();
  }
  /**
   * @summary Removes the given user from contributor status on this LiveThread.
   * @param {object} options
   * @param {string} options.name The username of the account who should be removed
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').removeContributor({name: 'actually_an_aardvark'})
   */


  removeContributor(_ref5) {
    var _this11 = this;

    var name = _ref5.name;
    return _asyncToGenerator(function* () {
      var userId = (yield _this11._r.getUser(name).fetch()).id;
      var res = yield _this11._post({
        url: "api/live/".concat(_this11.id, "/rm_contributor"),
        form: {
          api_type,
          id: "t2_".concat(userId)
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this11;
    })();
  }
  /**
   * @summary Sets the permissions of the given contributor.
   * @param {object} options
   * @param {string} options.name The name of the user whose permissions should be changed
   * @param {Array} options.permissions The updated permissions that the user should have. This should be an Array containing
   * some combination of `'update', 'edit', 'manage'`. To give the contributor with full permissions, omit this property.
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').setContributorPermissions({name: 'actually_an_aardvark', permissions: ['edit']})
   */


  setContributorPermissions(_ref6) {
    var _this12 = this;

    var name = _ref6.name,
        permissions = _ref6.permissions;
    return _asyncToGenerator(function* () {
      var res = yield _this12._post({
        url: "api/live/".concat(_this12.id, "/set_contributor_permissions"),
        form: {
          api_type,
          name,
          permissions: (0, _helpers.formatLivethreadPermissions)(permissions),
          type: 'liveupdate_contributor'
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this12;
    })();
  }
  /**
   * @summary Edits the settings on this LiveThread.
   * @param {object} options
   * @param {string} options.title The title of the thread
   * @param {string} [options.description] A descriptions of the thread. 120 characters max
   * @param {string} [options.resources] Information and useful links related to the thread.
   * @param {boolean} options.nsfw Determines whether the thread is Not Safe For Work
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').editSettings({title: 'My livethread', description: 'an updated description'})
   */


  editSettings(_ref7) {
    var _this13 = this;

    var title = _ref7.title,
        description = _ref7.description,
        resources = _ref7.resources,
        nsfw = _ref7.nsfw;
    return _asyncToGenerator(function* () {
      var res = yield _this13._post({
        url: "api/live/".concat(_this13.id, "/edit"),
        form: {
          api_type,
          description,
          nsfw,
          resources,
          title
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this13;
    })();
  }
  /**
   * @summary Permanently closes this thread, preventing any more updates from being added.
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').closeThread()
   */


  closeThread() {
    var _this14 = this;

    return _asyncToGenerator(function* () {
      yield _this14._post({
        url: "api/live/".concat(_this14.id, "/close_thread"),
        form: {
          api_type
        }
      });
      return _this14;
    })();
  }
  /**
   * @summary Reports this LiveThread for breaking reddit's rules.
   * @param {object} options
   * @param {string} options.reason The reason for the report. One of `spam`, `vote-manipulation`, `personal-information`,
   * `sexualizing-minors`, `site-breaking`
   * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
   * @example r.getLivethread('whrdxo8dg9n0').report({reason: 'Breaking a rule blah blah blah'})
   */


  report(_ref8) {
    var _this15 = this;

    var reason = _ref8.reason;
    return _asyncToGenerator(function* () {
      var res = yield _this15._post({
        url: "api/live/".concat(_this15.id, "/report"),
        form: {
          api_type,
          type: reason
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return _this15;
    })();
  }
  /**
   * @summary Gets a Listing containing past updates to this LiveThread.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing LiveUpdates
   * @example
   *
   * r.getLivethread('whrdxo8dg9n0').getRecentUpdates().then(console.log)
   * // => Listing [
   * //  LiveUpdate { ... },
   * //  LiveUpdate { ... },
   * //  ...
   * // ]
   */


  getRecentUpdates(options) {
    return this._getListing({
      uri: "live/".concat(this.id),
      qs: options
    });
  }
  /**
   * @summary Gets a list of reddit submissions linking to this LiveThread.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Submissions
   * @example
   *
   * r.getLivethread('whrdxo8dg9n0').getDiscussions().then(console.log)
   * // => Listing [
   * //  Submission { ... },
   * //  Submission { ... },
   * //  ...
   * // ]
   */


  getDiscussions(options) {
    return this._getListing({
      uri: "live/".concat(this.id, "/discussions"),
      qs: options
    });
  }
  /**
   * @summary Stops listening for new updates on this LiveThread.
   * @desc To avoid memory leaks that can result from open sockets, it's recommended that you call this method when you're
   * finished listening for updates on this LiveThread.
   *
   * This should not be confused with {@link LiveThread#closeThread}, which marks the thread as "closed" on reddit.
   * @returns undefined
   * @example
   *
   * var myThread = r.getLivethread('whrdxo8dg9n0');
   * myThread.stream.on('update', content => {
   *   console.log(content);
   *   myThread.closeStream();
   * })
   *
   */


  closeStream() {
    if (this._rawStream) {
      this._rawStream.close();
    }
  }

};
var _default = LiveThread;
exports.default = _default;