import { S3Policy } from '../src/S3Policy'

describe('S3Policy.generate', () => {

  describe('required options', () => {
    let options = {}

    beforeEach(() => options = {
      key: 'image.jpg',
      bucket: 'my-s3-bucket',
      contentType: 'image/jpg',
      region: 'us-east-2',
      accessKey: "AKIAA7AS6DHAD6ASN23",
      secretKey: "pLx+brfx0u12ERMcJCfNAEOKH+bMk40ZVa7hh8",
    })

    test('ensures `key` key is present', () => {
      Reflect.deleteProperty(options, 'key')
      expect(() => S3Policy.generate(options)).toThrow('Must provide `key` option with the object key')
    })

    test('ensures `bucket` key is present', () => {
      Reflect.deleteProperty(options, 'bucket')
      expect(() => S3Policy.generate(options)).toThrow('Must provide `bucket` option with your AWS bucket name')
    })

    test('ensures `contentType` key is present', () => {
      Reflect.deleteProperty(options, 'contentType')
      expect(() => S3Policy.generate(options)).toThrow('Must provide `contentType` option with the object content type')
    })

    test('ensures `accessKey` key is present', () => {
      Reflect.deleteProperty(options, 'accessKey')
      expect(() => S3Policy.generate(options)).toThrow('Must provide `accessKey` option with your AWSAccessKeyId')
    })

    test('ensures `secretKey` key is present', () => {
      Reflect.deleteProperty(options, 'secretKey')
      expect(() => S3Policy.generate(options)).toThrow('Must provide `secretKey` option with your AWSSecretKey')
    })
  })
})
