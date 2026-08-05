/**
 * @typedef {Object} configOptions
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {Object} PluginConfig
 * @property {string} id
 * @property {string} label
 * @property {string} type
 * @property {string} [text]
 * @property {string|Function} [func]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {number|string|Object<string,string|number>} default
 * @property {configOptions[]} [options]
 */

/**
 * @typedef {Object} Hotkey
 * @property {string} key
 * @property {string} name
 * @property {string} description
 * @property {Function} func
 * @property {string} [category]
 * @property {boolean} [ctrlKey]
 * @property {boolean} [altKey]
 * @property {boolean} [shiftKey]
 * @property {boolean} [metaKey]
 * @property {boolean} [private]
 * @property {boolean} [repeat]
 */