/**
 * RNS3
 */

import { Request } from './Request'
import { S3Policy } from './S3Policy'

const EXPECTED_RESPONSE_KEY_VALUE_RE = {
  key: /<Key>(.*)<\/Key>/,
  etag: /<ETag>"?([^"]*)"?<\/ETag>/,
  bucket: /<Bucket>(.*)<\/Bucket>/,
  location: /<Location>(.*)<\/Location>/,
}

const entries = o =>
  Object.keys(o).map(k => [k, o[k]])

const extractResponseValues = (responseText) =>
  entries(EXPECTED_RESPONSE_KEY_VALUE_RE).reduce((result, [key, regex]) => {
    const match = responseText.match(regex)
    return { ...result, [key]: match && match[1] }
  }, {})

const setBodyAsParsedXML = (response) =>
  ({
    ...response,
    body: { postResponse: response.text == null ? null : extractResponseValues(response.text) }
  })

export class RNS3 {
  static getAwsUrl(options) {
    if(options.awsUrl) {
      return options.awsUrl;
    }

    return `s3${options.region ? `-${options.region}` : ''}.amazonaws.com`;
  }

  static put(file, options) {
    options = {
      ...options,
      key: (options.keyPrefix || '') + file.name,
      date: new Date,
      contentType: file.type
    }

    const url = options.urlAsPath ?
      `https://${RNS3.getAwsUrl(options)}/${options.bucket}` :
      `https://${options.bucket}.${RNS3.getAwsUrl(options)}`
    const method = "POST"
    const policy = S3Policy.generate(options)

    return Request.create(url, method, policy)
      .set("file", file)
      .send()
      .then(setBodyAsParsedXML)
  }
}
