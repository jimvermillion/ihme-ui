import { isNaN, isUndefined, map, range as range_ } from 'lodash';

/**
 * @param {Number} num
 * @param {Array} range
 */
export function percentOfRange(num, range) {
  const [min, max] = range;
  return (1 / ((max - min) / (num - min)));
}

/**
 * @param {Number} percent -> value between [0, 1] inclusive
 * @param {Array} range
 */
export function numFromPercent(percent, range) {
  const [min, max] = range;
  return min + ((max - min) * percent);
}

/**
 * @param {Number} percent -> value between [0, 1] inclusive
 * @param {Array} range
 */
export function domainFromPercent(newDomain, oldDomain, rangeExtent) {
  // find what percent of range the old domain was clamped to
  let x1Pct = percentOfRange(rangeExtent[0], oldDomain);
  let x2Pct = percentOfRange(rangeExtent[1], oldDomain);

  // handle division errors, if any
  if (isNaN(x1Pct) || isUndefined(x1Pct)) x1Pct = 0;
  if (isNaN(x2Pct) || isUndefined(x2Pct)) x2Pct = 1;

  return [numFromPercent(x1Pct, newDomain), numFromPercent(x2Pct, newDomain)];
}

/**
 * turn [min, max] domain into domain of length
 * that matches cardinality of colors array
 * @param {array} domain - [min, max] of x-scale domain
 * @param {number} length - intended length of returned array
 * @returns {array}
 */
export function linspace(domain, length) {
  if (length < 2 || domain.length < 2 || domain[0] === domain[1]) return domain;

  const step = Math.abs(domain[1] - domain[0]) / (length - 1);
  const [min, max] = domain.sort((a, b) => a - b);

  return map(range_(length), (i) => {
    if (i === length - 1) return max;
    return i * step + min;
  });
}

/**
 * Base check that value is within the range of extent (up to and including start and end)
 * @param {Number} value -> e.g., 1993
 * @param {Array} extent -> e.g., [1990, 1994]
 * @return {Boolean}
 */
export function isWithinRange(value, extent) {
  return !!(value >= extent[0] && value <= extent[1]);
}


/**
 * Check that value is within the range of extent
 * and return value or nearest value from within extent.
 * If extent is empty, returns value.
 *
 * E.g.:
 *  `ensureWithinRange(1993, [1990, 1994])` -> 1993
 *  `ensureWithinRange(1989, [1990, 1994])` -> 1990
 *  `ensureWithinRange(2000, [1990, 1994])` -> 1994
 *  `ensureWithinRange(2000, [])` -> 2000
 *
 * @param {Number} value
 * @param {Array} extent
 * @return {Number}
 */
export function ensureWithinRange(value, extent) {
  if (extent.length < 1) return value;
  return Math.min(Math.max(Math.min(...extent), value), Math.max(...extent));
}
