/**
 * S3Policy
 */

const CryptoJS = require('crypto-js');
const Buffer = global.Buffer || require('buffer').Buffer;
const { dateToString } = require('./DateUtils');

const FIVE_MINUTES = (5 * (60 * 1000));

const AWS_ACL = "public-read";
const AWS_SERVICE_NAME = "s3";
const AWS_REQUEST_POLICY_VERSION = "aws4_request";
const AWS_ALGORITHM = "AWS4-HMAC-SHA256";

const DEFAULT_SUCCESS_ACTION_STATUS = "201";

const assert = (object, message) => {
  if (null == object) throw new Error(message);
}

export class S3Policy {
  static generate(options) {
    options || (options = {});

    assert(options.key, "Must provide `key` option with the object key");
    assert(options.bucket, "Must provide `bucket` option with your AWS bucket name");
    assert(options.contentType, "Must provide `contentType` option with the object content type");
    assert(options.region, "Must provide `region` option with your AWS region");
    assert(options.date, "Must provide `date` option with the current date");
    assert(options.accessKey, "Must provide `accessKey` option with your AWSAccessKeyId");
    assert(options.secretKey, "Must provide `secretKey` option with your AWSSecretKey");

    const date = options.date;
    const timeDelta = options.timeDelta || 0;
    const policyExpiresIn = FIVE_MINUTES - timeDelta;
    const expirationDate = new Date(date.getTime() + policyExpiresIn);

    const policyParams = {
      ...options,
      acl: options.acl || AWS_ACL,
      algorithm: AWS_ALGORITHM,
      amzDate: dateToString(date, 'amz-iso8601'),
      yyyymmddDate: dateToString(date, 'yyyymmdd'),
      expirationDate: dateToString(expirationDate, 'iso8601'),
      successActionStatus: String(options.successActionStatus || DEFAULT_SUCCESS_ACTION_STATUS),
    }

    policyParams.credential = [
      policyParams.accessKey,
      policyParams.yyyymmddDate,
      policyParams.region,
      AWS_SERVICE_NAME,
      AWS_REQUEST_POLICY_VERSION
    ].join('/');

    const policy = formatPolicyForEncoding(policyParams);
    const base64EncodedPolicy = getEncodedPolicy(policy);
    const signature = getSignature(base64EncodedPolicy, policyParams);

    return formatPolicyForRequestBody(base64EncodedPolicy, signature, policyParams);
  }
}

const getDate = () => {
  let date = new Date();
  let yymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
  let amzDate = yymmdd + "T000000Z";
  return { yymmdd: yymmdd, amzDate: amzDate }
}

/**
 * Expires in 5 minutes. Amazon will reject request
 * if it arrives after the expiration date.
 *
 * returns string in ISO8601 GMT format, i.e.
 *
 *     2016-03-24T20:43:47.314Z
 */
const getExpirationDate = () => {
  return new Date(
    (new Date).getTime() + FIVE_MINUTES
  ).toISOString();
}

const getPolicyParams = (options) => {
  let date = getDate();
  let expiration = getExpirationDate();

  return {
    acl: options.acl || AWS_ACL,
    algorithm: AWS_ALGORITHM,
    bucket: options.bucket,
    contentType: options.contentType,
    credential:  options.accessKey + "/" + date.yymmdd + "/" + options.region + "/" + AWS_SERVICE_NAME + "/" + AWS_REQUEST_POLICY_VERSION,
    date: date,
    expiration: expiration,
    key: options.key,
    region: options.region,
    secretKey: options.secretKey,
    successActionStatus: '' + (options.successActionStatus || DEFAULT_SUCCESS_ACTION_STATUS),
    metadata: options.metadata
  }
}

const formatPolicyForRequestBody = (base64EncodedPolicy, signature, options) => {
  return {
    "key": options.key,
    "acl": options.acl,
    "success_action_status": options.successActionStatus,
    "Content-Type": options.contentType,
    "X-Amz-Credential": options.credential,
    "X-Amz-Algorithm": options.algorithm,
    "X-Amz-Date": options.amzDate,
    "Policy": base64EncodedPolicy,
    "X-Amz-Signature": signature,
  }
}

const formatPolicyForEncoding = (policy) => {
  const policyForEncoding = {
    "expiration": policy.expirationDate,
    "conditions": [
       {"bucket": policy.bucket},
       {"key": policy.key},
       {"acl": policy.acl},
       {"success_action_status": policy.successActionStatus},
       {"Content-Type": policy.contentType},
       {"x-amz-credential": policy.credential},
       {"x-amz-algorithm": policy.algorithm},
       {"x-amz-date": policy.amzDate}
    ]
  }

  if(policy.metadata){
    Object.keys(policy.metadata).forEach((k) => {
      let metadata = String(policy.metadata[k]);
      policyForEncoding.conditions.push({[k]: metadata});
    });
  }

  return policyForEncoding;
}

const getEncodedPolicy = (policy) => {
  return Buffer.from(
    JSON.stringify(policy),
    "utf-8"
  ).toString("base64");
}

const getSignature = (base64EncodedPolicy, options) => {
  return CryptoJS.HmacSHA256(
    base64EncodedPolicy,
    getSignatureKey(options)
  ).toString(CryptoJS.enc.Hex);
}

const getSignatureKey = (options) => {
   const kDate = CryptoJS.HmacSHA256(options.yyyymmddDate, "AWS4" + options.secretKey);
   const kRegion = CryptoJS.HmacSHA256(options.region, kDate);
   const kService = CryptoJS.HmacSHA256(AWS_SERVICE_NAME, kRegion);
   const kSigning = CryptoJS.HmacSHA256(AWS_REQUEST_POLICY_VERSION, kService);

   return kSigning;
}
