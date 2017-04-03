/**
 * RNS3
 */

import { Request } from './Request'
import { S3Policy } from './S3Policy'

const AWS_DEFAULT_S3_HOST = 's3.amazonaws.com'

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
  static put(file, options) {
    options = {
      ...options,
      key: (options.keyPrefix || '') + file.name,
      date: new Date,
      contentType: file.type
    }

    const url = `https://${options.bucket}.${options.awsUrl || AWS_DEFAULT_S3_HOST}`
    const method = "POST"
    const policy = S3Policy.generate(options)

    return Request.create(url, method, policy)
      .set("file", file)
      .send()
      .then(setBodyAsParsedXML)
  }
}
