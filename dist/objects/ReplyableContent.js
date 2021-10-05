"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helpers = require("../helpers.js");

var _RedditContent = _interopRequireDefault(require("./RedditContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var api_type = 'json';
/**
 * A set of mixin functions that apply to Submissions, Comments, and PrivateMessages
 * <style> #ReplyableContent {display: none} </style>
 * @extends RedditContent
 */

var ReplyableContent = class ReplyableContent extends _RedditContent.default {
  /**
   * @summary Removes this Comment, Submission or PrivateMessage from public listings.
   * @desc This requires the authenticated user to be a moderator of the subreddit with the `posts` permission.
   * @param {object} options
   * @param {boolean} [options.spam=false] Determines whether this should be marked as spam
   * @returns {Promise} A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').remove({spam: true})
   */
  remove() {
    var _this = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$spam = _ref.spam,
        spam = _ref$spam === void 0 ? false : _ref$spam;

    return _asyncToGenerator(function* () {
      yield _this._post({
        url: 'api/remove',
        form: {
          spam,
          id: _this.name
        }
      });
      return _this;
    })();
  }
  /**
   * @summary Approves this Comment, Submission, or PrivateMessage, re-adding it to public listings if it had been removed
   * @returns {Promise} A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').approve()
   */


  approve() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2._post({
        url: 'api/approve',
        form: {
          id: _this2.name
        }
      });
      return _this2;
    })();
  }
  /**
   * @summary Reports this content anonymously to subreddit moderators (for Comments and Submissions)
   * or to the reddit admins (for PrivateMessages)
   * @param {object} [options]
   * @param {string} [options.reason] The reason for the report
   * @returns {Promise} A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').report({reason: 'Breaking the subreddit rules'})
   */


  report() {
    var _this3 = this;

    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        reason = _ref2.reason;

    return _asyncToGenerator(function* () {
      yield _this3._post({
        url: 'api/report',
        form: {
          api_type,
          reason: 'other',
          other_reason: reason,
          thing_id: _this3.name
        }
      });
      return _this3;
    })();
  }
  /**
   * @summary Ignores reports on this Comment, Submission, or PrivateMessage
   * @returns {Promise} A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').ignoreReports()
   */


  ignoreReports() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      yield _this4._post({
        url: 'api/ignore_reports',
        form: {
          id: _this4.name
        }
      });
      return _this4;
    })();
  }
  /**
   * @summary Unignores reports on this Comment, Submission, or PrivateMessages
   * @returns {Promise} A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').unignoreReports()
   */


  unignoreReports() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      yield _this5._post({
        url: 'api/unignore_reports',
        form: {
          id: _this5.name
        }
      });
      return _this5;
    })();
  }
  /**
   * @summary Submits a new reply to this object. (This takes the form of a new Comment if this object is a Submission/Comment,
   * or a new PrivateMessage if this object is a PrivateMessage.)
   * @param {string} text The content of the reply, in raw markdown text
   * @returns {Promise} A Promise that fulfills with the newly-created reply
   * @example r.getSubmission('4e60m3').reply('This was an interesting post. Thanks.');
   */


  reply(text) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      var res = yield _this6._post({
        url: 'api/comment',
        form: {
          api_type,
          text,
          thing_id: _this6.name
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      return res.json.data.things[0];
    })();
  }
  /**
   * @summary Blocks the author of this content.
   * @desc **Note:** In order for this function to have an effect, this item **must** be in the authenticated account's inbox or
   * modmail somewhere. The reddit API gives no outward indication of whether this condition is satisfied, so the returned Promise
   * will fulfill even if this is not the case.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example
   *
   * r.getInbox({limit: 1}).then(messages =>
   *   messages[0].blockAuthor();
   * );
   */


  blockAuthor() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      yield _this7._post({
        url: 'api/block',
        form: {
          id: _this7.name
        }
      });
      return _this7;
    })();
  }

};
var _default = ReplyableContent;
exports.default = _default;