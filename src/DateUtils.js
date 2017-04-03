/**
 * DateUtils
 */

const YYYYMMDD = 'yyyymmdd'
const ISO8601 = 'iso8601'
const AMZ_ISO8601 = 'amz-iso8601'

const formatters = {
  /**
   * Returns a string formatted in iso8601 format (with '-'). `expiresIn`
   * option is added to current date time to get a date in the future
   * that represents the time this request to AWS will expire.
   *
   * === Example
   *
   *     // March 31, 2017 20:43:47.314
   *     '2017-03-31T20:43:47.314Z'
   */
  [ISO8601]: date => date.toISOString(),

  /**
   * Returns a string formatted like YYYYMMDD.
   *
   * === Example
   *
   *     // March 31, 2017 20:43:47.314
   *     '20170331'
   */
  [YYYYMMDD]: date => formatters[ISO8601](date).slice(0, 10).replace(/-/g, ""),

  /**
   * Returns a string formatted in iso8601 format (without '-') with
   * 0s for the time of day. Used for the amz date field in the policy.
   *
   * === Example
   *
   *     // March 31, 2017 20:43:47.314
   *     '20170331T000000Z'
   */
  [AMZ_ISO8601]: date => `${formatters[YYYYMMDD](date)}T000000Z`,
}

export const dateToString = (date, format = ISO8601) =>
  formatters[format](date)
