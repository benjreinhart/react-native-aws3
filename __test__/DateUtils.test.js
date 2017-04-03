import { dateToString } from '../src/DateUtils'

describe('dateToString', () => {

  const date = new Date(Date.parse('2017-03-31T20:43:47.314Z'))

  describe('iso8601', () => {
    it('formats the date in iso8601 format', () => {
      const actual = dateToString(date, 'iso8601')
      const expected = '2017-03-31T20:43:47.314Z'
      expect(actual).toBe(expected)
    })

    it('is the default', () => {
      const actual = dateToString(date)
      const expected = '2017-03-31T20:43:47.314Z'
      expect(actual).toBe(expected)
    })
  })

  describe('yyyymmdd', () => {
    it('formats the date YYYYMMDD', () => {
      const actual = dateToString(date, 'yyyymmdd')
      const expected = '20170331'
      expect(actual).toBe(expected)
    })
  })

  describe('amz-iso8601', () => {
    it('formats the date in iso8601 without hyphens and with the time zeroed out', () => {
      const actual = dateToString(date, 'amz-iso8601')
      const expected = '20170331T000000Z'
      expect(actual).toBe(expected)
    })
  })

})
