"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helpers = require("../helpers.js");

var _Comment = _interopRequireDefault(require("./Comment"));

var _VoteableContent = _interopRequireDefault(require("./VoteableContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var api_type = 'json';
/**
 * A class representing a reddit submission
 * <style> #Submission {display: none} </style>
 * @extends VoteableContent
 * @example
 *
 * // Get a submission by ID
 * r.getSubmission('2np694')
 */

var Submission = class Submission extends _VoteableContent.default {
  constructor(data, _r, _hasFetched) {
    super(data, _r, _hasFetched);
    this._callback = this._callback.bind(this);
    this._sort = this._sort || null;
    this._children = {};

    if (_hasFetched) {
      this.comments = this.comments || (0, _helpers.getEmptyRepliesListing)(this);
    }
  }

  _transformApiResponse(response) {
    response._sort = this._sort;

    for (var id in response._children) {
      var child = response._children[id];
      child._sort = response._sort;
      child._cb = response._callback;
    }

    return response;
  }
  /**
   * A function used to cache children to the `Submission._children` property. By "children" we mean
   * all nested comments/replies that belong to the submission. `Submission._children` used by
   * the function `Submission.getComment()` to get children that are in deep chains. We pass this function
   * to children as `Comment._cb()`.
   */


  _callback(child) {
    if (child instanceof _Comment.default) {
      var parent = child.parent_id.startsWith('t1_') ? this._children[child.parent_id.slice(3)] : this;

      if (parent) {
        var listing = parent.replies || parent.comments;
        var index = listing.findIndex(function (c) {
          return c.id === child.id;
        });

        if (index !== -1) {
          listing[index] = child;
        }
      }

      child._children[child.id] = child;

      this._callback({
        _children: child._children
      });
    } else {
      for (var id in child._children) {
        child._children[id]._sort = this._sort;
        child._children[id]._cb = this._callback;
      }

      Object.assign(this._children, child._children);
    }
  }

  get _uri() {
    return "comments/".concat(this.name.slice(3)).concat(this._sort ? "?sort=".concat(this._sort) : '');
  }
  /**
   * @summary Pick a comment from the comments tree or fetch it with a given id.
   * @param {string} commentId - The base36 id of the comment
   * @param {boolean} [fetch] - If true, this function will return an unfetched Comment object
   * instead. Calling `.fetch()` will make it replace the one with the same id on the tree if exists.
   * It will also expose all the children on its replies tree to this function.
   * @returns {Comment|null} A Comment object for the requested comment, or `null` when it's not available
   * on the comments tree.
   * @example
   *
   * const og = submission.comments[0].replies[0]
   * const comment = submission.getComment(og.id)
   * console.log(comment === og)
   * // => true
   */


  getComment(commentId, fetch) {
    var comment = this._children[commentId] || null;

    if (fetch) {
      comment = this._r._newObject('Comment', {
        name: (0, _helpers.addFullnamePrefix)(commentId, 't1_'),
        link_id: this.name,
        _sort: this._sort,
        _cb: this._callback
      });
    }

    return comment;
  }
  /**
   * @summary Fetch more comments and append them automatically to the comments listing. All comments and their
   * children will be exposed automatically to {@link Submission#getComment}.
   * @param {object|number} options - Object of fetching options or the number of comments to fetch. see
   * {@link Listing#fetchMore} for more details.
   * @returns {Promise} A Promise that fulfills with the comments listing.
   */


  fetchMore(options) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (typeof options !== 'number') {
        options.append = true;
      }

      var comments = yield _this.comments.fetchMore(options);

      _this._callback({
        _children: comments._children
      });

      _this.comments = comments;
      return comments;
    })();
  }
  /**
   * @summary Fetch all comments and append them automatically to the comments listing. All comments and their
   * children will be exposed automatically to {@link Submission#getComment}.
   * @param {object} [options] - Fetching options. see {@link Listing#fetchAll} for more details.
   * @returns {Promise} A Promise that fulfills with the comments listing.
   */


  fetchAll(options) {
    return this.fetchMore(_objectSpread({}, options, {
      amount: Infinity
    }));
  }
  /**
   * @summary Hides this Submission, preventing it from appearing on most Listings.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').hide()
   */


  hide() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2._post({
        url: 'api/hide',
        form: {
          id: _this2.name
        }
      });
      return _this2;
    })();
  }
  /**
   * @summary Unhides this Submission, allowing it to reappear on most Listings.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').unhide()
   */


  unhide() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      yield _this3._post({
        url: 'api/unhide',
        form: {
          id: _this3.name
        }
      });
      return _this3;
    })();
  }
  /**
   * @summary Locks this Submission, preventing new comments from being posted on it.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').lock()
   */


  lock() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      yield _this4._post({
        url: 'api/lock',
        form: {
          id: _this4.name
        }
      });
      return _this4;
    })();
  }
  /**
   * @summary Unlocks this Submission, allowing comments to be posted on it again.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').unlock()
   */


  unlock() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      yield _this5._post({
        url: 'api/unlock',
        form: {
          id: _this5.name
        }
      });
      return _this5;
    })();
  }
  /**
   * @summary Marks this Submission as NSFW (Not Safe For Work).
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').markNsfw()
   */


  markNsfw() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      yield _this6._post({
        url: 'api/marknsfw',
        form: {
          id: _this6.name
        }
      });
      return _this6;
    })();
  }
  /**
   * @summary Unmarks this Submission as NSFW (Not Safe For Work).
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').unmarkNsfw()
   */


  unmarkNsfw() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      yield _this7._post({
        url: 'api/unmarknsfw',
        form: {
          id: _this7.name
        }
      });
      return _this7;
    })();
  }
  /**
   * @summary Mark a submission as a spoiler
   * @desc **Note:** This will silently fail if the subreddit has disabled spoilers.
   * @returns {Promise} A Promise that fulfills with this Submission when the request is complete
   * @example r.getSubmission('2np694').markSpoiler()
   */


  markSpoiler() {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      yield _this8._post({
        url: 'api/spoiler',
        form: {
          id: _this8.name
        }
      });
      return _this8;
    })();
  }
  /**
   * @summary Unmark a submission as a spoiler
   * @returns {Promise} A Promise that fulfills with this Submission when the request is complete
   * @example r.getSubmission('2np694').unmarkSpoiler()
   */


  unmarkSpoiler() {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      yield _this9._post({
        url: 'api/unspoiler',
        form: {
          id: _this9.name
        }
      });
      return _this9;
    })();
  }
  /**
   * @summary Sets the contest mode status of this submission.
   * @private
   * @param {boolean} state The desired contest mode status
   * @returns {Promise} The updated version of this Submission
   */


  _setContestModeEnabled(state) {
    var _this10 = this;

    return _asyncToGenerator(function* () {
      yield _this10._post({
        url: 'api/set_contest_mode',
        form: {
          api_type,
          state,
          id: _this10.name
        }
      });
      return _this10;
    })();
  }
  /**
   * @summary Enables contest mode for this Submission.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').enableContestMode()
   */


  enableContestMode() {
    return this._setContestModeEnabled(true);
  }
  /**
   * @summary Disables contest mode for this Submission.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').disableContestMode()
   */


  disableContestMode() {
    return this._setContestModeEnabled(false);
  }

  _setStickied(_ref) {
    var _this11 = this;

    var state = _ref.state,
        num = _ref.num;
    return _asyncToGenerator(function* () {
      yield _this11._post({
        url: 'api/set_subreddit_sticky',
        form: {
          api_type,
          state,
          num,
          id: _this11.name
        }
      });
      return _this11;
    })();
  }
  /**
   * @summary Stickies this Submission.
   * @param {object} [options]
   * @param {number} [options.num=1] The sticky slot to put this submission in; this should be either 1 or 2.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').sticky({num: 2})
   */


  sticky() {
    var _this12 = this;

    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref2$num = _ref2.num,
        num = _ref2$num === void 0 ? 1 : _ref2$num;

    return _asyncToGenerator(function* () {
      yield _this12._setStickied({
        state: true,
        num
      });
      return _this12;
    })();
  }
  /**
   * @summary Unstickies this Submission.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').unsticky()
   */


  unsticky() {
    var _this13 = this;

    return _asyncToGenerator(function* () {
      yield _this13._setStickied({
        state: false
      });
      return _this13;
    })();
  }
  /**
   * @summary Sets the suggested comment sort method on this Submission
   * @desc **Note**: To enable contest mode, use {@link Submission#enableContestMode} instead.
   * @param {string} sort The suggested sort method. This should be one of
   * `confidence, top, new, controversial, old, random, qa, blank`
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').setSuggestedSort('new')
   */


  setSuggestedSort(sort) {
    var _this14 = this;

    return _asyncToGenerator(function* () {
      yield _this14._post({
        url: 'api/set_suggested_sort',
        form: {
          api_type,
          id: _this14.name,
          sort
        }
      });
      return _this14;
    })();
  }
  /**
   * @summary Marks this submission as 'visited'.
   * @desc **Note**: This function only works if the authenticated account has a subscription to reddit gold.
   * @returns {Promise} The updated version of this Submission
   * @example r.getSubmission('2np694').markAsRead()
   */


  markAsRead() {
    var _this15 = this;

    return _asyncToGenerator(function* () {
      yield _this15._post({
        url: 'api/store_visits',
        form: {
          links: _this15.name
        }
      });
      return _this15;
    })();
  }
  /**
   * @summary Gets a Listing of other submissions on reddit that had the same link as this one.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing of other Submission objects
   * @example r.getSubmission('2np694').getDuplicates()
   */


  getDuplicates() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return this._getListing({
      uri: "duplicates/".concat(this.name.slice(3)),
      qs: options
    });
  }
  /**
   * @summary Gets a Listing of Submissions that are related to this one.
   * @deprecated This function uses the <code>/related/submission_id</code> endpoint, which was recently changed on reddit.com;
   * instead of returning a Listing containing related posts, the reddit API now simply returns the post itself. As such, this
   * function only exists for backwards compatability and should not be used in practice.
   * @param {object} [options={}] ~~Options for the resulting Listing~~
   * @returns {Promise} ~~A Listing of other Submission objects~~ The submission in question.
   * @example r.getSubmission('2np694').getRelated()
   */


  getRelated() {
    var _this16 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return _asyncToGenerator(function* () {
      var result = yield _this16._getListing({
        uri: "related/".concat(_this16.name.slice(3)),
        qs: options
      });

      if (result.constructor._name === 'Submission') {
        _this16._r._warn('Submission#getRelated has been deprecated upstream, and will not work as expected.');
      }

      return result;
    })();
  }
  /**
   * @summary Gets a list of flair template options for this post.
   * @returns {Promise} An Array of flair templates
   * @example
   *
   * r.getSubmission('2np694').getLinkFlairTemplates().then(console.log)
   *
   * // => [
   * //   { flair_text: 'Text 1', flair_css_class: '', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
   * //   { flair_text: 'Text 2', flair_css_class: 'aa', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
   * //   ...
   * // ]
   */


  getLinkFlairTemplates() {
    var _this17 = this;

    return _asyncToGenerator(function* () {
      yield _this17.fetch();
      return _this17.subreddit.getLinkFlairTemplates(_this17.name);
    })();
  }
  /**
   * @summary Assigns flair on this Submission (as a moderator; also see [selectFlair]{@link Submission#selectFlair})
   * @param {object} options
   * @param {string} options.text The text that this link's flair should have
   * @param {string} options.cssClass The CSS class that the link's flair should have
   * @returns {Promise} A Promise that fulfills with an updated version of this Submission
   * @example r.getSubmission('2np694').assignFlair({text: 'this is a flair text', cssClass: 'these are css classes'})
   */


  assignFlair(options) {
    var _this18 = this;

    return _asyncToGenerator(function* () {
      yield _this18.fetch();
      yield _this18._r._assignFlair(_objectSpread({}, options, {
        link: _this18.name,
        subredditName: _this18.subreddit.display_name
      }));
      return _this18;
    })();
  }
  /**
   * @summary Selects a flair for this Submission (as the OP; also see [assignFlair]{@link Submission#assignFlair})
   * @param {object} options
   * @param {string} options.flair_template_id A flair template ID to use for this Submission. (This should be obtained
   * beforehand using {@link getLinkFlairTemplates}.)
   * @param {string} [options.text] The flair text to use for the submission. (This is only necessary/useful if the given flair
   * template has the `text_editable` property set to `true`.)
   * @returns {Promise} A Promise that fulfills with this objects after the request is complete
   * @example r.getSubmission('2np694').selectFlair({flair_template_id: 'e3340d80-8152-11e4-a76a-22000bc1096c'})
   */


  selectFlair(options) {
    var _this19 = this;

    return _asyncToGenerator(function* () {
      yield _this19.fetch();
      yield _this19._r._selectFlair(_objectSpread({}, options, {
        link: _this19.name,
        subredditName: _this19.subreddit.display_name
      }));
      return _this19;
    })();
  }
  /**
   * @summary Crossposts this submission to a different subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the crosspost should be submitted to
   * @param {string} options.title The title of the crosspost
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   * the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * await r.getSubmission('6vths0').submitCrosspost({ title: 'I found an interesting post', subredditName: 'snoowrap' })
   */


  submitCrosspost(options) {
    return this._r.submitCrosspost(_objectSpread({}, options, {
      originalPost: this
    }));
  }

};
var _default = Submission;
exports.default = _default;