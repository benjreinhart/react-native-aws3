import { S3Policy } from '../src/S3Policy'

describe('S3Policy.generate', () => {
  let options = {}

  beforeEach(() => options = {
    key: 'image.jpg',
    bucket: 'my-s3-bucket',
    contentType: 'image/jpg',
    region: 'us-east-1',
    accessKey: "AKIAA7AS6DHAD6ASN23",
    secretKey: "pLx+brfx0u12ERMcJCfNAEOKH+bMk40ZVa7hh8",
  })

  describe('required options', () => {
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

  const withDatesStubbed = (dateStubs, test) => {
    const getDate = S3Policy.getDate
    const getExpirationDate = S3Policy.getExpirationDate

    return () => {
      S3Policy.getDate = jest.fn().mockReturnValueOnce(dateStubs.getDate)
      S3Policy.getExpirationDate = jest.fn().mockReturnValueOnce(dateStubs.getExpirationDate)

      test()

      expect(S3Policy.getDate.mock.calls.length).toBe(1)
      expect(S3Policy.getExpirationDate.mock.calls.length).toBe(1)

      S3Policy.getDate = getDate
      S3Policy.getExpirationDate = getExpirationDate
    }
  }

  it('generates the correct policy', withDatesStubbed(
    {
      getExpirationDate: '2017-03-30T22:22:36.059Z',
      getDate: { yymmdd: '20170330', amzDate: '20170330T000000Z' }
    },
    () => {
      const policy = S3Policy.generate(options)
      expect(policy).toHaveProperty('key', 'image.jpg')
      expect(policy).toHaveProperty('acl', 'public-read')
      expect(policy).toHaveProperty('success_action_status', '201')
      expect(policy).toHaveProperty('Content-Type', 'image/jpg')
      expect(policy).toHaveProperty('X-Amz-Algorithm', 'AWS4-HMAC-SHA256')
      expect(policy).toHaveProperty('X-Amz-Date', '20170330T000000Z')
      expect(policy).toHaveProperty('X-Amz-Credential', 'AKIAA7AS6DHAD6ASN23/20170330/us-east-1/s3/aws4_request')
      expect(policy).toHaveProperty('Policy', 'eyJleHBpcmF0aW9uIjoiMjAxNy0wMy0zMFQyMjoyMjozNi4wNTlaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0IjoibXktczMtYnVja2V0In0seyJrZXkiOiJpbWFnZS5qcGcifSx7ImFjbCI6InB1YmxpYy1yZWFkIn0seyJzdWNjZXNzX2FjdGlvbl9zdGF0dXMiOiIyMDEifSx7IkNvbnRlbnQtVHlwZSI6ImltYWdlL2pwZyJ9LHsieC1hbXotY3JlZGVudGlhbCI6IkFLSUFBN0FTNkRIQUQ2QVNOMjMvMjAxNzAzMzAvdXMtZWFzdC0xL3MzL2F3czRfcmVxdWVzdCJ9LHsieC1hbXotYWxnb3JpdGhtIjoiQVdTNC1ITUFDLVNIQTI1NiJ9LHsieC1hbXotZGF0ZSI6IjIwMTcwMzMwVDAwMDAwMFoifV19')
      expect(policy).toHaveProperty('X-Amz-Signature', '85eb411ba83c7bebb0a3e7c7acfc8136a588dd4456488bf8a79397a59c164a77')
    }
  ))

})
