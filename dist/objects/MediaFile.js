"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A class representing media files uploaded to reddit to be embedded on submissions. See {@link snoowrap#uploadMedia} for more details.
 */
class MediaFile {
    /**
     * @summary Constructs a new media file. In most cases you should call {@link snoowrap#uploadMedia} instead.
     * @param {FileInfo} options An object containing `fileUrl`, `assetId` along with optional `websocketUrl`, `caption` and `outboundUrl`.
     */
    constructor({ fileUrl, assetId, websocketUrl = '', caption = '', outboundUrl = '' }) {
        this.fileUrl = fileUrl;
        this.assetId = assetId;
        this.websocketUrl = websocketUrl;
        this.caption = caption;
        this.outboundUrl = outboundUrl;
    }
    /**
     * @summary This method allows to embed media files on selfposts bodies. This only works with {@link MediaImg}, {@link MediaVideo}
     * and {@link MediaGif} where the `type` property is set.
     * @desc **NOTE**: Embedded media will have a padding of `\n\n` automatically added. This is due to the weirdness with Reddit's API.
     * @returns {string} A string representation of the media file in Markdown format.
     * @example
     *
     * const mediaImg = await r.uploadMedia({ // Usage as a `MediaImg`.
     *   file: './image.png',
     *   type: 'img',
     *   caption: 'optional caption'
     * })
     *
     * const body = `This is an inline image: ${mediaImg} Cool huh?`
     * => "This is an inline image: \n\n![img](qwertyuiop \"optional caption\")\n\n Cool huh?"
     */
    toString() {
        return this.type ? `\n\n![${this.type}](${this.assetId} "${this.caption ? this.caption : ''}")\n\n` : '';
    }
}
exports.default = MediaFile;
/**
 * A subclass of {@link MediaFile} representing an image. The only difference is that the `type` property is set to `img`
 */
class MediaImg extends MediaFile {
    constructor(options) {
        super(options);
        /**
         * @summary The media type.
         */
        this.type = 'img';
    }
}
exports.MediaImg = MediaImg;
/**
 * A subclass of {@link MediaFile} representing a video. The only difference is that the `type` property is set to `video`
 */
class MediaVideo extends MediaFile {
    constructor(options) {
        super(options);
        /**
         * @summary The media type.
         */
        this.type = 'video';
    }
}
exports.MediaVideo = MediaVideo;
/**
 * A subclass of {@link MediaFile} representing a videogif. The only difference is that the `type` property is set to `gif`
 */
class MediaGif extends MediaVideo {
    constructor(options, a) {
        super(options);
        /**
         * @summary The media type.
         */
        this.type = 'gif';
    }
}
exports.MediaGif = MediaGif;
