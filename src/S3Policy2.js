/**
 * S3Policy2
 */

const { assert, shallowCopy } = require('./Util');

const CryptoJS = require('crypto-js');
const SHA256 = CryptoJS.SHA256;
const HMAC_SHA256 = CryptoJS.HmacSHA256;

const TWENTY_FOUR_HOURS_IN_SECONDS = (24 * (60 * 60));

const AWS_HOST = "s3.amazonaws.com";
const AWS_SERVICE_NAME = "S3";
const AWS_REQUEST_POLICY_VERSION = "aws4_request";
const AWS_ALGORITHM = "AWS4-HMAC-SHA256";
const AWS_UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

const getDate = () => {
  let date = new Date();
  let yymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  let amzDate = yymmdd + "T000000Z";
  return { yymmdd: yymmdd, amzDate: amzDate }
}

export class S3Policy2 {
  static generate(opts) {
    let options = shallowCopy(opts);

    options.date = getDate();
    options.credential = constructCredential(options);
    options.expires = options.expires || TWENTY_FOUR_HOURS_IN_SECONDS;

    let canonicalRequest = constructCanonicalRequest(options);

    console.log("CANONICAL REQ:", canonicalRequest);

    let stringToSign = constructStringToSign(options.date, options.credential, canonicalRequest);
    console.log("STS:", stringToSign);

    let signature = constructSignature(constructSigningKey(options), stringToSign);

    return constructUrl(signature, options);
  }
}

/**
 * Resulting URL example (newlines for clarity):
 *
 *     https://examplebucket.s3.amazonaws.com/test.txt
 *       ?X-Amz-Algorithm=AWS4-HMAC-SHA256
 *       &X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request
 *       &X-Amz-Date=20130524T000000Z
 *       &X-Amz-Expires=86400
 *       &X-Amz-SignedHeaders=host
 *       &X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404
 *
 * X-Amz-Algorithm, X-Amz-Credential, X-Amz-Signature, X-Amz-Date, X-Amz-SignedHeaders, and X-Amz-Expires parameters.
 */
const constructUrl = (signature, options) => {
  let queryString = constructQueryString({
    "X-Amz-Algorithm": AWS_ALGORITHM,
    "X-Amz-Credential": options.credential,
    "X-Amz-Date": options.date.amzDate,
    "X-Amz-Expires": options.expires,
    "X-Amz-SignedHeaders": "host",
    "X-Amz-Signature": signature
  });

  return `https://${ constructHost(options.bucket) }${ options.path }?${ queryString }`;
}

const constructQueryString = (o) => {
  // Must be sorted
  return Object.keys(o)
    .sort()
    .map(key => `${ encodeURIComponent(key) }=${ encodeURIComponent(o[key]) }`)
    .join('&');
}

const constructHost = (bucket) => {
  return `${ bucket }.${ AWS_HOST }`;
}

const constructCredential = (options) => {
  return [
    options.accessKey,
    options.date.yymmdd,
    options.region,
    AWS_SERVICE_NAME,
    AWS_REQUEST_POLICY_VERSION
  ].join('/');
}

// X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host
const constructCanonicalRequest = (options) => {
  let parts = [];

  // GET | PUT | POST | DELETE ...
  parts.push(options.method.toUpperCase());

  // /path/to/object.jpg
  parts.push(options.path.split('?')[0]);

  // query string
  parts.push(constructQueryString({
    "X-Amz-Algorithm": AWS_ALGORITHM,
    "X-Amz-Credential": options.credential,
    "X-Amz-Date": options.date.amzDate,
    "X-Amz-Expires": options.expires,
    "X-Amz-SignedHeaders": "host"
  }));

  // Canonical headers separated by newlines (host must be included):
  parts.push(`host:${ constructHost(options.bucket) }\n`);

  // Signed header names separated by semi-colons
  parts.push('host');

  // Presigned urls do not have signed payloads
  parts.push(AWS_UNSIGNED_PAYLOAD);

  return parts.join('\n');
}

const constructStringToSign = (date, credential, canonicalRequest) => {
  return [
    AWS_ALGORITHM,
    date.amzDate,
    credential,
    SHA256(canonicalRequest).toString(CryptoJS.enc.Hex)
  ].join('\n');
}

const constructSignature = (signingKey, stingToSign) => {
  return HMAC_SHA256(signingKey, stingToSign).toString(CryptoJS.enc.Hex);
}

const constructSigningKey = (options) => {
   let kDate = HMAC_SHA256(options.date.yymmdd, "AWS4" + options.secretKey);
   let kRegion = HMAC_SHA256(options.region, kDate);
   let kService = HMAC_SHA256(AWS_SERVICE_NAME, kRegion);
   let kSigning = HMAC_SHA256(AWS_REQUEST_POLICY_VERSION, kService);

   return kSigning;
}
