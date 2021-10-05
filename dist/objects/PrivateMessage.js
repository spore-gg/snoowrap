"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helpers = require("../helpers.js");

var _ReplyableContent = _interopRequireDefault(require("./ReplyableContent.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * A class representing a private message or a modmail.
 * <style> #PrivateMessage {display: none} </style>
 * @example
 *
 * // Get a Private Message with a given ID
 * r.getMessage('51shnw')
 * @extends ReplyableContent
 */
var PrivateMessage = class PrivateMessage extends _ReplyableContent.default {
  get _uri() {
    return "message/messages/".concat(this.name.slice(3));
  }

  _transformApiResponse(response) {
    response[0].replies = (0, _helpers.buildRepliesTree)(response[0].replies || []);
    return (0, _helpers.findMessageInTree)(this.name, response[0]);
  } // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs

  /**
   * @summary Marks this message as read.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').markAsRead()
   */


  markAsRead() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this._r.markMessagesAsRead([_this]);
      return _this;
    })();
  }
  /**
   * @summary Marks this message as unread.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').markAsUnread()
   */


  markAsUnread() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2._r.markMessagesAsUnread([_this2]);
      return _this2;
    })();
  }
  /**
   * @summary Mutes the author of this message for 72 hours. This can only be used on moderator mail.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').muteAuthor()
   */


  muteAuthor() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      yield _this3._post({
        url: 'api/mute_message_author',
        form: {
          id: _this3.name
        }
      });
      return _this3;
    })();
  }
  /**
   * @summary Unmutes the author of this message.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').unmuteAuthor()
   */


  unmuteAuthor() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      yield _this4._post({
        url: 'api/unmute_message_author',
        form: {
          id: _this4.name
        }
      });
      return _this4;
    })();
  }
  /**
   * @summary Deletes this message from the authenticated user's inbox.
   * @desc This only removes the item from the authenticated user's inbox. It has no effect on how the item looks to the sender.
   * @returns {Promise} A Promise that fulfills with this message when the request is complete.
   * @example
   *
   * const firstMessage = r.getInbox().get(0);
   * firstMessage.deleteFromInbox();
   */


  deleteFromInbox() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      yield _this5._post({
        url: 'api/del_msg',
        form: {
          id: _this5.name
        }
      });
      return _this5;
    })();
  }

};
var _default = PrivateMessage;
exports.default = _default;