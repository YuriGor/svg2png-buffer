'use strict';

import phantom from 'phantom';

/**
 * @typedef {object} Sizes
 * @prop {number} [height]
 * @prop {number} [width]
 */

const DEBUG = typeof v8debug === 'object' || process.env.DEBUG === 'true' || process.env.VERBOSE === 'true';



/**
 * Promise phantom instance for later usage
 * @return {object} Contains phantom inctance ready to use
 */
module.exports = function(){
    return phantom.create()
        .then(instance => {
            return {
                render:function(svgString, size = {}){
                    return instance.createPage()
                    .then(page => {
                        const closePage = () => {
                            if (page) {
                                page.close()
                            }
                        };
                        return page.open('data:image/svg+xml;utf8,'+svgString)
                        .then(status => {
                            if (status !== "success") {
                                let errMsg = `Svg has been opened with status ${status}`;
                                logError(errMsg);
                                throw new Error(errMsg);
                            }
                            if (DEBUG) {
                                page.property('onConsoleMessage', msg => console.log(msg));
                            }
                            log(`SVG opened`);
                            size = size || {};
                            log(`set SVG sizes to ${JSON.stringify(size)}`);
                            return page.evaluate(setSVGDimensions, size || {})
                                .then(checkEvalError)
                                .then(() => page.evaluate(getSVGDimensions))
                                .then(checkEvalError)
                                .then(dimensions => page.evaluate(setSVGDimensions, dimensions))
                                .then(checkEvalError)
                                .then(dimensions => page.property('viewportSize', dimensions))
                        })
                        .then(() => {
                            log('Render page');
                            return page.renderBase64("PNG")
                        })
                        .then(imageBase64 => new Buffer(imageBase64, 'base64'))
                        .then(imageData => {
                            log(`SVG converted successfully`);
                            closePage();
                            return imageData;
                        }, error => {
                            console.log('Ooops');
                            closePage();
                            return Promise.reject(error);
                        });
                    });
                },
                close:function(){
                    if (instance) {
                        log('close phantom instance');
                        instance.exit();
                    }
                }
            };
        });
}

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
            return {width: width, height: height};
        }

        var viewBoxWidth = el.viewBox.animVal.width;
        var viewBoxHeight = el.viewBox.animVal.height;

        if (width && viewBoxHeight) {
            return {width: width, height: width * viewBoxHeight / viewBoxWidth};
        }

        if (height && viewBoxWidth) {
            return {width: height * viewBoxWidth / viewBoxHeight, height: height};
        }

        return null;
    } catch (error) {
        return {error: error};
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
        return {error: error};
    }
}