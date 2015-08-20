/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

/* Modified work copyright © 2015 David Valdman */

define(function(require, exports, module) {
    var EventHandler = require('../core/EventHandler');

    /**
     * Combines multiple types of sync classes (e.g. mouse, touch,
     *  scrolling) into one standardized interface for inclusion in widgets.
     *
     *  Sync classes are first registered with a key, and then can be accessed
     *  globally by key.
     *
     *  Emits 'start', 'update' and 'end' events as a union of the sync class
     *  providers.
     *
     * @class GenericInput
     * @constructor
     * @param syncs {Object|Array} object with fields {sync key : sync options}
     *    or an array of registered sync keys
     * @param [options] {Object|Array} options object to set on all syncs
     */
    function GenericInput(syncs, options) {
        this._eventInput = new EventHandler();
        this._eventOutput = new EventHandler();

        EventHandler.setInputHandler(this, this._eventInput);
        EventHandler.setOutputHandler(this, this._eventOutput);

        this._syncs = {};
        if (syncs) this.addInput(syncs);
        if (options) this.setOptions(options);
    }

    GenericInput.DIRECTION_X = 0;
    GenericInput.DIRECTION_Y = 1;
    GenericInput.DIRECTION_Z = 2;

    // Global registry of sync classes. Append only.
    var registry = {};

    /**
     * Register a global sync class with an identifying key
     *
     * @static
     * @method register
     *
     * @param syncObject {Object} an object of {sync key : sync options} fields
     */
    GenericInput.register = function register(syncObject) {
        for (var key in syncObject){
            if (registry[key]){
                if (registry[key] === syncObject[key]) return; // redundant registration
                else throw new Error('this key is registered to a different sync class');
            }
            else registry[key] = syncObject[key];
        }
    };

    /**
     * Helper to set options on all sync instances
     *
     * @method setOptions
     * @param options {Object} options object
     */
    GenericInput.prototype.setOptions = function(options) {
        for (var key in this._syncs){
            this._syncs[key].setOptions(options);
        }
    };

    /**
     * Subscribe events from a sync class
     *
     * @method subscribeInput
     * @param key {String} identifier for sync class
     */
    GenericInput.prototype.subscribeInput = function subscribeSync(key) {
        var sync = this._syncs[key];
        sync.subscribe(this._eventInput);
        this._eventOutput.subscribe(sync);
    };

    /**
     * Unsunscribe events from a sync class
     *
     * @method unsubscribeInput
     * @param key {String} identifier for sync class
     */
    GenericInput.prototype.unsubscribeInput = function unsubscribeSync(key) {
        var sync = this._syncs[key];
        sync.unsubscribe(this._eventInput);
        this._eventOutput.unsubscribe(sync);
    };

    function _addSingleInput(key, options) {
        if (!registry[key]) return;
        this._syncs[key] = new (registry[key])(options);
        this.subscribeInput(key);
    }

    /**
     * Add a sync class to from the registered classes
     *
     * @method addInput
     * @param syncs {Object|Array.String} an array of registered sync keys
     *    or an object with fields {sync key : sync options}
     */
    GenericInput.prototype.addInput = function addSync(syncs) {
        if (syncs instanceof Array)
            for (var i = 0; i < syncs.length; i++)
                _addSingleInput.call(this, syncs[i]);
        else if (syncs instanceof Object)
            for (var key in syncs)
                _addSingleInput.call(this, key, syncs[key]);
    };

    module.exports = GenericInput;
});