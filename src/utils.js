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

export const setBodyAsParsedXML = (response) =>
  ({
    ...response,
    body: { postResponse: response.text == null ? null : extractResponseValues(response.text) }
  })
