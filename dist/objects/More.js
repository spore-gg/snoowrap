"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.emptyChildren = void 0;

var _lodash = require("lodash");

var _Promise2 = _interopRequireDefault(require("../Promise.js"));

var _helpers = require("../helpers.js");

var _constants = require("../constants.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var api_type = 'json';
/**
 * The `More` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
 * on a thread.
 * No instances of the `More` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
 * Additional replies on an item can be fetched by calling `fetchMore` on a Listing, in the same manner as what would be done
 * with a Listing of posts. snoowrap should handle the differences internally, and expose a nearly-identical interface for the
 * two use-cases.
 *
 * Combining reddit's `Listing` and `more` objects has the advantage of having a more consistent exposed interface; for example,
 * if a consumer iterates over the comments on a Submission, all of the iterated items will actually be Comment objects, so the
 * consumer won't encounter an unexpected `more` object at the end. However, there are a few disadvantages, namely that (a) this
 * leads to an increase in internal complexity, and (b) there are a few cases where reddit's `more` objects have different amounts
 * of available information (e.g. all the child IDs of a `more` object are known on creation), which leads to different optimal
 * behavior.
 */

var More = class More {
  constructor(options, _r) {
    Object.assign(this, options);
    this._r = _r;
  }
  /**
   * Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
   * it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
   * to /api/info.
   */


  fetchMore(options) {
    var _this = this;

    var startIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var children = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var nested = arguments.length > 3 ? arguments[3] : undefined;
    return _asyncToGenerator(function* () {
      if (options.amount <= 0 || startIndex >= _this.children.length) {
        return [];
      }

      if (!options.skipReplies) {
        return _this.fetchTree(options, startIndex, children, nested);
      }

      var ids = getNextIdSlice(_this.children, startIndex, options.amount, _constants.MAX_API_INFO_AMOUNT).map(function (id) {
        return "t1_".concat(id);
      }); // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
      // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)

      var thisBatch = yield _this._r._getListing({
        uri: 'api/info',
        qs: {
          id: ids.join(',')
        }
      });
      Object.assign(children, thisBatch._children);

      var nextRequestOptions = _objectSpread({}, options, {
        amount: options.amount - ids.length
      });

      var remainingItems = yield _this.fetchMore(nextRequestOptions, startIndex + ids.length, children, true);
      var res = (0, _lodash.flatten)([thisBatch, remainingItems]);

      if (!nested) {
        res._children = children;
      }

      return res;
    })();
  }

  fetchTree(options, startIndex) {
    var _this2 = this;

    var children = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var nested = arguments.length > 3 ? arguments[3] : undefined;
    return _asyncToGenerator(function* () {
      if (options.amount <= 0 || startIndex >= _this2.children.length) {
        return [];
      }

      var ids = getNextIdSlice(_this2.children, startIndex, options.amount, _constants.MAX_API_MORECHILDREN_AMOUNT);
      var res = yield _this2._r._get({
        url: 'api/morechildren',
        params: {
          api_type,
          children: ids.join(','),
          link_id: _this2.link_id || _this2.parent_id
        }
      });
      (0, _helpers.handleJsonErrors)(res);
      var resultTrees = (0, _helpers.buildRepliesTree)(res.json.data.things.map(_helpers.addEmptyRepliesListing));
      Object.assign(children, res._children);
      /**
       * Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only
       * send some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
       * In these cases, recursively fetch the smaller `more` objects as well.
       */

      var childMores = (0, _lodash.remove)(resultTrees, function (c) {
        return c instanceof More;
      });
      (0, _lodash.forEach)(childMores, function (c) {
        return c.link_id = _this2.link_id || _this2.parent_id;
      });
      var expandedTrees = yield _Promise2.default.all(childMores.map(function (c) {
        return c.fetchTree(_objectSpread({}, options, {
          amount: Infinity
        }), 0, children, true);
      }));
      var nexts = yield _this2.fetchMore(_objectSpread({}, options, {
        amount: options.amount - ids.length
      }), startIndex + ids.length, children, true);
      resultTrees = (0, _lodash.concat)(resultTrees, (0, _lodash.flatten)(expandedTrees), nexts);

      if (!nested) {
        resultTrees._children = children;
      }

      return resultTrees;
    })();
  }

  _clone() {
    return new More((0, _lodash.pick)(this, Object.getOwnPropertyNames(this)), this._r);
  }

};

function getNextIdSlice(children, startIndex, desiredAmount, limit) {
  return children.slice(startIndex, startIndex + Math.min(desiredAmount, limit));
}

var emptyChildren = new More({
  children: []
});
exports.emptyChildren = emptyChildren;
var _default = More;
exports.default = _default;