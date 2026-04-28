/**
 * @typedef {Object} AddressContract
 * @property {string} label
 * @property {string} postalCode
 * @property {string} street
 * @property {string} number
 * @property {string} complement
 * @property {string} neighborhood
 * @property {string} city
 * @property {string} state
 */

/**
 * @typedef {Object} UserContract
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {AddressContract[]} savedAddresses
 */

/**
 * @typedef {Object} AuthSessionContract
 * @property {string} token
 * @property {UserContract} user
 */

/**
 * @typedef {Object} MenuItemContract
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {number} priceCents
 * @property {string | undefined} imageUrl
 * @property {string | undefined} imageHint
 * @property {string | undefined} accentColor
 * @property {boolean} isFeatured
 * @property {boolean} availableForDineIn
 * @property {boolean} availableForDelivery
 */
