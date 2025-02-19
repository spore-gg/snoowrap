"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MEDIA_TYPES = exports.MIME_TYPES = exports.MAX_LISTING_ITEMS = exports.MAX_API_MORECHILDREN_AMOUNT = exports.MAX_API_INFO_AMOUNT = exports.MAX_TOKEN_LATENCY = exports.IDEMPOTENT_HTTP_VERBS = exports.HTTP_VERBS = exports.LIVETHREAD_PERMISSIONS = exports.MODERATOR_PERMISSIONS = exports.PLACEHOLDER_REGEX = exports.SUBMISSION_ID_REGEX = exports.USERNAME_REGEX = exports.KINDS = exports.SUBREDDIT_KEYS = exports.USER_KEYS = exports.API_RULES_LINK = exports.DOCS_LINK = exports.VERSION = exports.MODULE_NAME = void 0;
var MODULE_NAME = 'snoowrap';
exports.MODULE_NAME = MODULE_NAME;
var VERSION = '1.23.0';
exports.VERSION = VERSION;
var DOCS_LINK = 'https://not-an-aardvark.github.io/snoowrap/';
exports.DOCS_LINK = DOCS_LINK;
var API_RULES_LINK = 'https://github.com/reddit/reddit/wiki/API';
/* USER_KEYS and SUBREDDIT_KEYS are keys that are replaced by RedditUser and Subreddit objects when encountered in
`snoowrap#_populate`. `author`, `approved_by`, `banned_by`, and `subreddit` all appear in fetched Submissions, among other
places. `user` appears in responses from the api/flairlist endpoint, and `sr` appears in responses from the `api/v1/me/karma`
endpoint. */

exports.API_RULES_LINK = API_RULES_LINK;
var USER_KEYS = new Set(['author', 'approved_by', 'banned_by', 'user']);
exports.USER_KEYS = USER_KEYS;
var SUBREDDIT_KEYS = new Set(['subreddit', 'sr']);
exports.SUBREDDIT_KEYS = SUBREDDIT_KEYS;
var KINDS = {
  t1: 'Comment',
  t2: 'RedditUser',
  t3: 'Submission',
  t4: 'PrivateMessage',
  t5: 'Subreddit',
  t6: 'Trophy',
  t8: 'PromoCampaign',
  Listing: 'Listing',
  more: 'More',
  UserList: 'UserList',
  KarmaList: 'KarmaList',
  TrophyList: 'TrophyList',
  subreddit_settings: 'SubredditSettings',
  modaction: 'ModAction',
  wikipage: 'WikiPage',
  wikipagesettings: 'WikiPageSettings',
  wikipagelisting: 'WikiPageListing',
  LiveUpdateEvent: 'LiveThread',
  LiveUpdate: 'LiveUpdate',
  LabeledMulti: 'MultiReddit',
  ModmailConversation: 'ModmailConversation',
  ModmailConversationAuthor: 'ModmailConversationAuthor'
};
exports.KINDS = KINDS;
var USERNAME_REGEX = /^[\w-]{1,20}$/;
exports.USERNAME_REGEX = USERNAME_REGEX;
var SUBMISSION_ID_REGEX = /comments\/(.+?)\//;
exports.SUBMISSION_ID_REGEX = SUBMISSION_ID_REGEX;
var PLACEHOLDER_REGEX = /{(\w+)}/g;
exports.PLACEHOLDER_REGEX = PLACEHOLDER_REGEX;
var MODERATOR_PERMISSIONS = ['wiki', 'posts', 'access', 'mail', 'config', 'flair'];
exports.MODERATOR_PERMISSIONS = MODERATOR_PERMISSIONS;
var LIVETHREAD_PERMISSIONS = ['update', 'edit', 'manage'];
exports.LIVETHREAD_PERMISSIONS = LIVETHREAD_PERMISSIONS;
var HTTP_VERBS = ['delete', 'get', 'head', 'patch', 'post', 'put'];
exports.HTTP_VERBS = HTTP_VERBS;
var IDEMPOTENT_HTTP_VERBS = ['delete', 'get', 'head', 'put'];
exports.IDEMPOTENT_HTTP_VERBS = IDEMPOTENT_HTTP_VERBS;
var MAX_TOKEN_LATENCY = 10000;
exports.MAX_TOKEN_LATENCY = MAX_TOKEN_LATENCY;
var MAX_API_INFO_AMOUNT = 100;
exports.MAX_API_INFO_AMOUNT = MAX_API_INFO_AMOUNT;
var MAX_API_MORECHILDREN_AMOUNT = 20;
exports.MAX_API_MORECHILDREN_AMOUNT = MAX_API_MORECHILDREN_AMOUNT;
var MAX_LISTING_ITEMS = 100;
exports.MAX_LISTING_ITEMS = MAX_LISTING_ITEMS;
var MIME_TYPES = {
  png: 'image/png',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif'
};
exports.MIME_TYPES = MIME_TYPES;
var MEDIA_TYPES = {
  img: 'image',
  video: 'video',
  gif: 'video'
};
exports.MEDIA_TYPES = MEDIA_TYPES;