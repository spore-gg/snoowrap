"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _RedditContent = _interopRequireDefault(require("./RedditContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * A class representing a wiki page on a subreddit.
 *
 * **Note:** Due to a bug in reddit's CORS settings, it is not possible to fetch the contents of a wiki page on a private
 * subreddit while running snoowrap in a browser. (This issue does not apply when running snoowrap in Node.js.)
 *
 * <style> #WikiPage {display: none} </style>
 * @extends RedditContent
 * @example
 *
 * // Get a wiki page on a given subreddit by name
 * r.getSubreddit('AskReddit').getWikiPage('rules')
 */
var WikiPage = class WikiPage extends _RedditContent.default {
  get _uri() {
    return "r/".concat(this.subreddit.display_name, "/wiki/").concat(this.title);
  }
  /**
   * @summary Gets the current settings for this wiki page.
   * @returns {Promise} An Object representing the settings for this page
   * @example
   *
   * r.getSubreddit('snoowrap').getWikiPage('index').getSettings().then(console.log)
   * // => WikiPageSettings { permlevel: 0, editors: [], listed: true }
   */


  getSettings() {
    return this._get({
      url: "r/".concat(this.subreddit.display_name, "/wiki/settings/").concat(this.title)
    });
  }
  /**
   * @summary Edits the settings for this wiki page.
   * @param {object} options
   * @param {boolean} options.listed Determines whether this wiki page should appear on the public list of pages for this
   * subreddit.
   * @param {number} options.permissionLevel Determines who should be allowed to access and edit this page `0` indicates that
   * this subreddit's default wiki settings should get used, `1` indicates that only approved wiki contributors on this subreddit
   * should be able to edit this page, and `2` indicates that only mods should be able to view and edit this page.
   * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').editSettings({listed: false, permission_level: 1})
   */


  editSettings(_ref) {
    var _this = this;

    var listed = _ref.listed,
        permission_level = _ref.permission_level,
        _ref$permissionLevel = _ref.permissionLevel,
        permissionLevel = _ref$permissionLevel === void 0 ? permission_level : _ref$permissionLevel;
    return _asyncToGenerator(function* () {
      yield _this._post({
        url: "r/".concat(_this.subreddit.display_name, "/wiki/settings/").concat(_this.title),
        form: {
          listed,
          permlevel: permissionLevel
        }
      });
      return _this;
    })();
  }

  _modifyEditor(_ref2) {
    var name = _ref2.name,
        action = _ref2.action;
    return this._post({
      url: "r/".concat(this.subreddit.display_name, "/api/wiki/alloweditor/").concat(action),
      form: {
        page: this.title,
        username: name
      }
    });
  }
  /**
   * @summary Makes the given user an approved editor of this wiki page.
   * @param {object} options
   * @param {string} options.name The name of the user to be added
   * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').addEditor({name: 'actually_an_aardvark'})
   */


  addEditor(_ref3) {
    var _this2 = this;

    var name = _ref3.name;
    return _asyncToGenerator(function* () {
      yield _this2._modifyEditor({
        name,
        action: 'add'
      });
      return _this2;
    })();
  }
  /**
   * @summary Revokes this user's approved editor status for this wiki page
   * @param {object} options
   * @param {string} options.name The name of the user to be removed
   * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').removeEditor({name: 'actually_an_aardvark'})
   */


  removeEditor(_ref4) {
    var _this3 = this;

    var name = _ref4.name;
    return _asyncToGenerator(function* () {
      yield _this3._modifyEditor({
        name,
        action: 'del'
      });
      return _this3;
    })();
  }
  /**
   * @summary Edits this wiki page, or creates it if it does not exist yet.
   * @param {object} options
   * @param {string} options.text The new content of the page, in markdown.
   * @param {string} [options.reason] The edit reason that will appear in this page's revision history. 256 characters max
   * @param {string} [options.previousRevision] Determines which revision this edit should be added to. If this parameter is
   * omitted, this edit is simply added to the most recent revision.
   * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').edit({text: 'Welcome', reason: 'Added a welcome message'})
   */


  edit(_ref5) {
    var _this4 = this;

    var text = _ref5.text,
        reason = _ref5.reason,
        previous_revision = _ref5.previous_revision,
        _ref5$previousRevisio = _ref5.previousRevision,
        previousRevision = _ref5$previousRevisio === void 0 ? previous_revision : _ref5$previousRevisio;
    return _asyncToGenerator(function* () {
      yield _this4._post({
        url: "r/".concat(_this4.subreddit.display_name, "/api/wiki/edit"),
        form: {
          content: text,
          page: _this4.title,
          previous: previousRevision,
          reason
        }
      });
      return _this4;
    })();
  }
  /**
   * @summary Gets a list of revisions for this wiki page.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing revisions of this page
   * @example
   *
   * r.getSubreddit('snoowrap').getRevisions({limit: 1}).then(console.log)
   * // => Listing [
   * //  {
   * //    timestamp: 1460973194,
   * //    reason: 'Added a welcome message',
   * //    author: RedditUser { name: 'not_an_aardvark', id: 'k83md', ... },
   * //    page: 'index',
   * //    id: '506370b4-0508-11e6-b550-0e69f29e0c4d'
   * //  }
   * // ]
   */


  getRevisions(options) {
    return this._getListing({
      uri: "r/".concat(this.subreddit.display_name, "/wiki/revisions/").concat(this.title),
      qs: options
    });
  }
  /**
   * @summary Hides the given revision from this page's public revision history.
   * @param {object} options
   * @param {string} options.id The revision's id
   * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').hideRevision({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
   */


  hideRevision(_ref6) {
    var _this5 = this;

    var id = _ref6.id;
    return _asyncToGenerator(function* () {
      yield _this5._post({
        url: "r/".concat(_this5.subreddit.display_name, "/api/wiki/hide"),
        params: {
          page: _this5.title,
          revision: id
        }
      });
      return _this5;
    })();
  }
  /**
   * @summary Reverts this wiki page to the given point.
   * @param {object} options
   * @param {string} options.id The id of the revision that this page should be reverted to
   * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').revert({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
   */


  revert(_ref7) {
    var _this6 = this;

    var id = _ref7.id;
    return _asyncToGenerator(function* () {
      yield _this6._post({
        url: "r/".concat(_this6.subreddit.display_name, "/api/wiki/revert"),
        params: {
          page: _this6.title,
          revision: id
        }
      });
      return _this6;
    })();
  }
  /**
   * @summary Gets a list of discussions about this wiki page.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing discussions about this page
   * @example
   *
   * r.getSubreddit('snoowrap').getWikiPage('index').getDiscussions().then(console.log)
   * // => Listing [
   * //  Submission { ... },
   * //  Submission { ... },
   * //  ...
   * // ]
   */


  getDiscussions(options) {
    return this._getListing({
      uri: "r/".concat(this.subreddit.display_name, "/wiki/discussions/").concat(this.title),
      qs: options
    });
  }

};
var _default = WikiPage;
exports.default = _default;