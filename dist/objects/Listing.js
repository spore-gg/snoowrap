"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = require("lodash");

var _util = _interopRequireDefault(require("util"));

var _url = require("url");

var _helpers = require("../helpers.js");

var _errors = require("../errors.js");

var _More = _interopRequireWildcard(require("./More.js"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var INTERNAL_DEFAULTS = {
  _query: {},
  _transform: function (value) {
    return value;
  },
  _method: 'get',
  _isCommentList: false,
  _link_id: null,
  _uri: null,
  _more: null,
  _cachedLookahead: null
};
/**
 * A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
 * an Array (length, forEach, etc.) in addition to some added methods. The Listing can be extended by using the
 * [#fetchMore()]{@link Listing#fetchMore} and [#fetchAll()]{@link Listing#fetchAll} functions.
 * Note that these methods return new Listings, rather than mutating the original Listing.
 *
 * Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
 *
 * If you've used the reddit API before (or used other API wrappers like [PRAW](https://praw.readthedocs.org/en/stable/)), you
 * might know that reddit uses a `MoreComments` object in its raw JSON responses, representing comments that have been stubbed
 * out of Listings. In snoowrap, there are no exposed `MoreComments` objects; the objects returned by the reddit API are
 * stripped from Listings and are used internally as sources for the `fetchMore` functions. This means that in snoowrap, Listings
 * that contain Comments can be used/expanded in the same manner as Listings that don't contain Comments, and for the most part
 * you don't have to worry about the distinction.
 *
 * (Incidentally, if you encounter a Listing that *does* contain a `MoreComments` object then it's a bug, so please report it.)
 *
 * <style> #Listing {display: none} </style>
 * @extends Array
 */

var Listing = class Listing extends Array {
  constructor() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _r = arguments.length > 1 ? arguments[1] : undefined;

    super();

    if (!(this instanceof Listing)) {
      // Safari 9 has an incorrect implementation of classes that extend Arrays. As a workaround,
      // manually set the constructor and prototype.
      this.constructor = Listing;
      Object.setPrototypeOf(this, Listing.prototype);
    }

    this.push.apply(this, _toConsumableArray(options.children || []));
    this._r = _r;
    this._cachedLookahead = options._cachedLookahead;
    (0, _lodash.defaultsDeep)(this, (0, _lodash.pick)(options, Object.keys(INTERNAL_DEFAULTS)), INTERNAL_DEFAULTS);
    Object.assign(this._query, (0, _lodash.pick)(options, ['before', 'after']));

    if (options.children && options.children[options.children.length - 1] instanceof _More.default) {
      this._setMore(this.pop());
    }
  }

  _setUri(value) {
    var parsedUri = (0, _url.parse)(value, true);
    this._uri = parsedUri.pathname;
    (0, _lodash.defaultsDeep)(this._query, parsedUri.query);

    if (parsedUri.query.before) {
      this._query.after = null;
    } else {
      this._query.before = null;
    }
  }
  /**
  * @summary A getter that indicates whether this Listing has any more items to fetch.
  * @type {boolean}
  */


  get isFinished() {
    // The process of checking whether a Listing is 'finished' varies depending on what kind of Listing it is.
    return this._isCommentList
    /**
     * For comment Listings (i.e. Listings containing comments and comment replies, sourced by `more` objects): A Listing is
     * *never* finished if it has a cached lookahead (i.e. extra items that were fetched from a previous request). If there is
     * no cached lookahead, a Listing is finished iff it has an empty `more` object.
     */
    ? (0, _lodash.isEmpty)(this._cachedLookahead) && !!this._more && (0, _lodash.isEmpty)(this._more.children)
    /**
     * For non-comment Listings: A Listing is always finished if it has no URI (since there would be nowhere to fetch items
     * from). If it has a URI, a Listing is finished iff its `before` and `after` query are both `null`. This is because reddit
     * returns a value of `null` as the `after` and `before` parameters to signify that a Listing is complete.
     *
     * It is important to check for `null` here rather than any falsey value, because when an empty Listing is initialized, its
     * `after` and `before` properties are both `undefined`, but calling these empty Listings `finished` would be incorrect.
     */
    : !this._uri || this._query.after === null && this._query.before === null;
  }

  get is_finished() {
    // camel-case alias for backwards-compatibility.
    // As a getter, the `isFinished` property doesn't have an alias like everything else.
    return this.isFinished;
  }
  /**
   * @summary Fetches some more items
   * @param {object|number} options Object of fetching options or the number of items to fetch.
   * @param {number} options.amount The number of items to fetch.
   * @param {boolean} [options.skipReplies=false] For a Listing that contains comment objects on a Submission, this option can
   * be used to save a few API calls, provided that only top-level comments are being examined. If this is set to `true`, snoowrap
   * is able to fetch 100 Comments per API call rather than 20, but all returned Comments will have no fetched replies by default.
   *
   * Internal details: When `skipReplies` is set to `true`, snoowrap uses reddit's `api/info` endpoint to fetch Comments. When
   * `skipReplies` is set to `false`, snoowrap uses reddit's `api/morechildren` endpoint. It's worth noting that reddit does
   * not allow concurrent requests to the `api/morechildren` endpoint by the same account.
   * @param {boolean} [options.append=true] If `true`, the resulting Listing will contain the existing elements in addition to
   * the newly-fetched elements. If `false`, the resulting Listing will only contain the newly-fetched elements.
   * @returns {Promise} A new Listing containing the newly-fetched elements. If `options.append` is `true`, the new Listing will
   * also contain all elements that were in the original Listing. Under most circumstances, the newly-fetched elements will appear
   * at the end of the new Listing. However, if reverse pagination is enabled (i.e. if this Listing was created with a `before`
   * query parameter), then the newly-fetched elements will appear at the beginning. In any case, continuity is maintained, i.e.
   * the order of items in the Listing will be the same as the order in which they appear on reddit.
   * @example
   * r.getHot({limit: 25}).then(myListing => {
   *   console.log(myListing.length); // => 25
   *   myListing.fetchMore({amount: 10}).then(extendedListing => {
   *     console.log(extendedListing.length); // => 35
   *   })
   * });
   */


  fetchMore(options) {
    var parsedOptions = (0, _lodash.defaults)(typeof options === 'number' ? {
      amount: options
    } : (0, _lodash.clone)(options), // Accept either `skip_replies` or `skipReplies` for backwards compatibility.
    {
      append: true,
      skipReplies: options.skip_replies
    });

    if (typeof parsedOptions.amount !== 'number' || Number.isNaN(parsedOptions.amount)) {
      throw new _errors.InvalidMethodCallError('Failed to fetch Listing. (`amount` parameter was missing or invalid)');
    }

    if (parsedOptions.amount <= 0 || this.isFinished) {
      return parsedOptions.append ? this._clone() : this._clone()._empty();
    }

    if (this._cachedLookahead) {
      var cloned = this._clone();

      cloned.push.apply(cloned, _toConsumableArray(cloned._cachedLookahead.splice(0, parsedOptions.amount)));
      return cloned.fetchMore(parsedOptions.amount - cloned.length + this.length);
    }

    return this._more ? this._fetchMoreComments(parsedOptions) : this._fetchMoreRegular(parsedOptions);
  }

  _fetchMoreRegular(options) {
    var _this = this;

    return _asyncToGenerator(function* () {
      var query = (0, _lodash.omitBy)((0, _lodash.clone)(_this._query), function (value) {
        return value === null || value === undefined;
      });

      if (!_this._isCommentList) {
        /**
         * Reddit returns a different number of items per request depending on the `limit` querystring property specified in the
         * request. If no `limit` property is specified, reddit returns some number of items depending on the user's preferences
         * (currently 25 items with default preferences). If a `limit` property is specified, then reddit returns `limit` items per
         * batch. However, this is capped at 100, so if a `limit` larger than 100 items is specified, reddit will only return 100
         * items in the batch. (The cap of 100 could plausibly change to a different amount in the future.)
         *
         * However, one caveat is that reddit's parser doesn't understand the javascript `Infinity` global. If `limit=Infinity` is
         * provided in the querystring, reddit won't understand the parameter so it'll just act as if no parameter was provided, and
         * will return 25 items in the batch. This is suboptimal behavior as far as snoowrap is concerned, because it means that 4
         * times as many requests are needed to fetch the entire listing.
         *
         * To get around the issue, snoowrap caps the `limit` property at Number.MAX_SAFE_INTEGER when sending requests. This ensures
         * that `Infinity` will never be sent as part of the querystring, so reddit will always return the maximal 100 items per
         * request if the desired amount of items is large.
         */
        query.limit = Math.min(options.amount, Number.MAX_SAFE_INTEGER);
      }

      var response = yield _this._r.oauthRequest({
        url: _this._uri,
        params: query,
        method: _this._method
      });
      response = _this._transform(response);

      var cloned = _this._clone();

      if (!options.append) {
        cloned._empty();
      }

      if (cloned._query.before) {
        cloned.unshift.apply(cloned, _toConsumableArray(response));
        cloned._query.before = response._query.before;
        cloned._query.after = null;
      } else {
        cloned.push.apply(cloned, _toConsumableArray(response));
        cloned._query.before = null;
        cloned._query.after = response._query.after;
      }

      if (_this._isCommentList) {
        cloned._more = cloned._more || response._more || _More.emptyChildren;

        if (response.length > options.amount) {
          cloned._cachedLookahead = Array.from(cloned.splice(options.amount));
        }
      }

      return cloned.fetchMore(_objectSpread({}, options, {
        append: true,
        amount: options.amount - response.length
      }));
    })();
  }
  /**
   * Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
   * within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
   * in the thread.
   */


  _fetchMoreComments(options) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var moreComments = yield _this2._more.fetchMore(options);
      var children = moreComments._children;

      var cloned = _this2._clone();

      if (!options.append) {
        cloned._empty();
      } // Rebuild comments listing since Reddit doesn't return it in the right order sometimes


      for (var id of cloned._more.children.splice(0, options.amount)) {
        var comment = children[id]; // Ignore comments removed from listing

        if (comment) {
          cloned.push(comment);
        }
      }

      cloned._children = children;
      return cloned;
    })();
  }
  /**
   * @summary Fetches all of the items in this Listing, only stopping when there are none left.
   * @param {object} [options] Fetching options -- see {@link Listing#fetchMore}
   * @returns {Promise} A new fully-fetched Listing. Keep in mind that this method has the potential to exhaust your
   * ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
   * @example
   *
   * r.getMe().getUpvotedContent().fetchAll().then(console.log)
   * // => Listing [ Submission { ... }, Submission { ... }, ... ]
   */


  fetchAll(options) {
    return this.fetchMore(_objectSpread({}, options, {
      amount: Infinity
    }));
  }

  fetchUntil(options) {
    this._r._warn('Listing#fetchUntil is deprecated -- use Listing#fetchMore instead.');

    return this.fetchMore(_objectSpread({}, options, {
      append: true,
      amount: options.length - this.length
    }));
  }

  _clone() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$deep = _ref.deep,
        deep = _ref$deep === void 0 ? false : _ref$deep;

    var properties = (0, _lodash.pick)(this, Object.keys(INTERNAL_DEFAULTS));
    properties._query = (0, _lodash.clone)(properties._query);
    properties._cachedLookahead = (0, _lodash.clone)(properties._cachedLookahead);
    properties._more = this._more && this._more._clone();
    var shallowChildren = Array.from(this);
    properties.children = deep ? shallowChildren.map(function (item) {
      return '_clone' in item && typeof item._clone === 'function' ? item._clone({
        deep
      }) : item;
    }) : shallowChildren;
    return new Listing(properties, this._r);
  }

  _setMore(moreObj) {
    this._more = moreObj;
    this._isCommentList = true;
  }

  _empty() {
    this.splice(0, this.length);
    return this;
  }

  toJSON() {
    return Array.from(this).map(function (item) {
      return item && item.toJSON ? item.toJSON() : item;
    });
  }

};
(0, _helpers.defineInspectFunc)(Listing.prototype, function () {
  return "Listing ".concat(_util.default.inspect(Array.from(this)));
});
var _default = Listing;
exports.default = _default;