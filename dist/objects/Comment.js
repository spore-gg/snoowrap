"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helpers = require("../helpers.js");

var _Listing = _interopRequireDefault(require("./Listing.js"));

var _More = require("./More.js");

var _Submission = _interopRequireDefault(require("./Submission.js"));

var _VoteableContent = _interopRequireDefault(require("./VoteableContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * A class representing a reddit comment
 * <style> #Comment {display: none} </style>
 * @example
 *
 * // Get a comment with the given ID
 * r.getComment('c0hkuyq')
 *
 * @extends VoteableContent
 */
var Comment = class Comment extends _VoteableContent.default {
  constructor(options, _r, _hasFetched) {
    super(options, _r, _hasFetched);
    this._cb = this._cb || null;
    this._sort = this._sort || null;
    this._children = {};

    if (_hasFetched) {
      /**
       * If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
       * comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
       * replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that.
       */
      if (this.replies instanceof _Listing.default && !this.replies.length && this.replies._more && this.replies._more.name === 't1__') {
        this.replies = (0, _helpers.getEmptyRepliesListing)(this);
      } else if (this.replies === '') {
        /**
         * If a comment has no replies, reddit returns an empty string as its `replies` property rather than an empty Listing.
         * This behavior is unexpected, so replace the empty string with an empty Listing.
         */
        this.replies = this._r._newObject('Listing', {
          children: [],
          _more: _More.emptyChildren,
          _isCommentList: true
        });
      } else if (this.replies._more && !this.replies._more.link_id) {
        this.replies._more.link_id = this.link_id;
      }
    }
  }

  _transformApiResponse(response) {
    if (response instanceof _Submission.default) {
      var children = response._children;
      response = response.comments[0];
      delete children[response.id];
      response._children = children;
      response._sort = this._sort || null;
      response._cb = this._cb || null;

      if (this._cb) {
        this._cb(response);
      }

      return response;
    }

    response[0]._sort = this._sort || null;
    return (0, _helpers.addEmptyRepliesListing)(response[0]);
  }

  get _uri() {
    return !this.link_id ? "api/info?id=".concat(this.name) : "comments/".concat(this.link_id.slice(3), "?comment=").concat(this.name.slice(3)).concat(this._sort ? "&sort=".concat(this._sort) : '');
  }
  /**
   * @summary Fetch more replies and append them automatically to the replies listing. All replies and their
   * children will be exposed automatically to {@link Submission#getComment}.
   * @param {object|number} options - Object of fetching options or the number of replies to fetch. see
   * {@link Listing#fetchMore} for more details.
   * @returns {Promise} A Promise that fulfills with the replies listing.
   */


  fetchMore(options) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (typeof options !== 'number') {
        options.append = true;
      }

      var comments = yield _this.replies.fetchMore(options);

      if (_this._cb) {
        _this._cb({
          _children: comments._children
        });
      }

      _this.replies = comments;
      return comments;
    })();
  }
  /**
   * @summary Fetch all replies and append them automatically to the replies listing. All replies and their
   * children will be exposed automatically to {@link Submission#getComment}.
   * @param {object} [options] - Fetching options. see {@link Listing#fetchAll} for more details.
   * @returns {Promise} A Promise that fulfills with the replies listing.
   */


  fetchAll(options) {
    return this.fetchMore(_objectSpread({}, options, {
      amount: Infinity
    }));
  }
  /**
   * @summary Locks this Comment, preventing new comments from being posted on it.
   * @returns {Promise} The updated version of this Comment
   * @example r.getComment('d1xclfo').lock()
   */


  lock() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2._post({
        url: 'api/lock',
        form: {
          id: _this2.name
        }
      });
      return _this2;
    })();
  }
  /**
   * @summary Unlocks this Comment, allowing comments to be posted on it again.
   * @returns {Promise} The updated version of this Comment
   * @example r.getComment('d1xclfo').unlock()
   */


  unlock() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      yield _this3._post({
        url: 'api/unlock',
        form: {
          id: _this3.name
        }
      });
      return _this3;
    })();
  }

};
var _default = Comment;
exports.default = _default;