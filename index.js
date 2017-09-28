'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _phantom = require('phantom');

var _phantom2 = _interopRequireDefault(_phantom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @typedef {object} Sizes
 * @prop {number} [height]
 * @prop {number} [width]
 */

var DEBUG = (typeof v8debug === 'undefined' ? 'undefined' : _typeof(v8debug)) === 'object' || process.env.DEBUG === 'true' || process.env.VERBOSE === 'true';

/**
 * Promise phantom instance for later usage
 * @return {object} Contains phantom inctance ready to use, and several
 */
module.exports = function () {
    return _phantom2.default.create().then(function (instance) {
        return {
            convert: function convert(svgString) {
                var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

                return instance.createPage().then(function (page) {
                    var closePage = function closePage() {
                        if (page) {
                            page.close();
                        }
                    };
                    return page.open('data:image/svg+xml;utf8,' + svgString).then(function (status) {
                        if (status !== "success") {
                            var errMsg = 'Svg has been opened with status ' + status;
                            logError(errMsg);
                            throw new Error(errMsg);
                        }
                        if (DEBUG) {
                            page.property('onConsoleMessage', function (msg) {
                                return console.log(msg);
                            });
                        }
                        log('SVG opened');
                        size = size || {};
                        log('set SVG sizes to ' + JSON.stringify(size));
                        return page.evaluate(setSVGDimensions, size || {}).then(checkEvalError).then(function () {
                            return page.evaluate(getSVGDimensions);
                        }).then(checkEvalError).then(function (dimensions) {
                            return page.evaluate(setSVGDimensions, dimensions);
                        }).then(checkEvalError).then(function (dimensions) {
                            return page.property('viewportSize', dimensions);
                        });
                    }).then(function () {
                        log('Render page');
                        return page.renderBase64("PNG");
                    }).then(function (imageBase64) {
                        return new Buffer(imageBase64, 'base64');
                    }).then(function (imageData) {
                        log('SVG converted successfully');
                        closePage();
                        return imageData;
                    }, function (error) {
                        console.log('Ooops');
                        closePage();
                        return Promise.reject(error);
                    });
                });
            },
            close: function close() {
                if (instance) {
                    log('close phantom instance');
                    instance.exit();
                }
            }
        };
    });
};

/**
 * PhantomJS node brige cannot reject promises by exception,
 * it is always succeed. This extracts error from result and returns rejected promise,
 * or returns evaluate result, if no error.
 */
function checkEvalError(result) {
    if (result && result.error) {
        return Promise.reject(result.error);
    }
    return result;
}

function log() {
    DEBUG && console.log.apply(console, arguments);
}

function logError() {
    DEBUG && console.error.apply(console, arguments);
}

/**
 * Get actual sizes of root elem
 * Interpreted by PhantomJS
 * @returns {Sizes|null}
 */
function getSVGDimensions() {
    console.log('Get page sizes');
    /* global document: true */
    try {
        var el = document.documentElement;

        var widthIsPercent = /%\s*$/.test(el.getAttribute("width") || ""); // Phantom doesn't have endsWith
        var heightIsPercent = /%\s*$/.test(el.getAttribute("height") || "");
        var width = !widthIsPercent && parseFloat(el.getAttribute("width"));
        var height = !heightIsPercent && parseFloat(el.getAttribute("height"));

        if (width && height) {
            return { width: width, height: height };
        }

        var viewBoxWidth = el.viewBox.animVal.width;
        var viewBoxHeight = el.viewBox.animVal.height;

        if (width && viewBoxHeight) {
            return { width: width, height: width * viewBoxHeight / viewBoxWidth };
        }

        if (height && viewBoxWidth) {
            return { width: height * viewBoxWidth / viewBoxHeight, height: height };
        }

        return null;
    } catch (error) {
        return { error: error };
    }
}

/**
 * Set sizes to root elem
 * Interpreted by PhantomJS
 * @param {Sizes} sizes
 * @returns {Sizes} same as size param
 */
function setSVGDimensions(sizes) {
    console.log('Set page sizes', JSON.stringify(sizes));
    try {
        var height = sizes.height;
        var width = sizes.width;

        /* global document: true */
        if (!width && !height) {
            return sizes;
        }

        var el = document.documentElement;

        if (!!width) {
            el.setAttribute("width", width + "px");
        } else {

            el.removeAttribute("width");
        }

        if (!!height) {
            el.setAttribute("height", height + "px");
        } else {
            el.removeAttribute("height");
        }
        return sizes;
    } catch (error) {
        return { error: error };
    }
}