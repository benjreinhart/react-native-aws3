/**
 * S3Policy
 */

const CryptoJS = require('crypto-js');
const Buffer = global.Buffer || require('buffer').Buffer;
const { assert } = require('./Util');

const FIVE_MINUTES = (5 * (60 * 1000));

const AWS_ACL = "public-read";
const AWS_SERVICE_NAME = "s3";
const AWS_REQUEST_POLICY_VERSION = "aws4_request";
const AWS_ALGORITHM = "AWS4-HMAC-SHA256";

const DEFAULT_SUCCESS_ACTION_STATUS = "201";

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

    const policyExpiresIn = FIVE_MINUTES - (options.timeDelta || 0);
    const decoratedDate = decorateDate(options.date, { expiresIn: policyExpiresIn });

    options.date = decoratedDate;

    const policyParams = getPolicyParams(options);
    const policy = formatPolicyForEncoding(policyParams);
    const base64EncodedPolicy = getEncodedPolicy(policy);
    const signature = getSignature(base64EncodedPolicy, policyParams);

    return formatPolicyForRequestBody(base64EncodedPolicy, signature, policyParams);
  }
}

const decorateDate = (date, { expiresIn }) =>
  Object.defineProperties(date, {
    /**
     * Returns a string formatted like YYYYMMDD.
     *
     * === Example
     *
     *     date                 // March 31, 2017 20:43:47.314
     *     date.yyyymmdd        // => '20170331'
     */
    yyyymmdd: {
      get() { return this.toISOString().slice(0, 10).replace(/-/g, "") }
    },

    /**
     * Returns a string formatted in iso8601 format (without '-') with
     * 0s for the time of day. Used for the amz date field in the policy.
     *
     * === Example
     *
     *     date                 // March 31, 2017 20:43:47.314
     *     date.amz             // => '20170331T000000Z'
     */
    amz: {
      get() { return `${this.yyyymmdd}T000000Z` }
    },

    /**
     * Returns a string formatted in iso8601 format (with '-'). `expiresIn`
     * option is added to current date time to get a date in the future
     * that represents the time this request to AWS will expire.
     *
     * === Example
     *
     *     date                 // March 31, 2017 20:43:47.314
     *     date.expiration      // => '2017-03-31T20:43:47.314Z'
     */
    expiration: {
      get() { return new Date(this.getTime() + expiresIn).toISOString() }
    }
  })


const getPolicyParams = (options) => {
  return {
    acl: options.acl || AWS_ACL,
    algorithm: AWS_ALGORITHM,
    bucket: options.bucket,
    contentType: options.contentType,
    credential:  options.accessKey + "/" + options.date.yyyymmdd + "/" + options.region + "/" + AWS_SERVICE_NAME + "/" + AWS_REQUEST_POLICY_VERSION,
    date: options.date,
    expiration: options.date.expiration,
    key: options.key,
    region: options.region,
    secretKey: options.secretKey,
    successActionStatus: '' + (options.successActionStatus || DEFAULT_SUCCESS_ACTION_STATUS)
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
    "X-Amz-Date": options.date.amz,
    "Policy": base64EncodedPolicy,
    "X-Amz-Signature": signature,
  }
}

const formatPolicyForEncoding = (policy) => {
  return {
    "expiration": policy.expiration,
    "conditions": [
       {"bucket": policy.bucket},
       {"key": policy.key},
       {"acl": policy.acl},
       {"success_action_status": policy.successActionStatus},
       {"Content-Type": policy.contentType},
       {"x-amz-credential": policy.credential},
       {"x-amz-algorithm": policy.algorithm},
       {"x-amz-date": policy.date.amz}
    ]
  }
}

const getEncodedPolicy = (policy) => {
  return new Buffer(
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
   const kDate = CryptoJS.HmacSHA256(options.date.yyyymmdd, "AWS4" + options.secretKey);
   const kRegion = CryptoJS.HmacSHA256(options.region, kDate);
   const kService = CryptoJS.HmacSHA256(AWS_SERVICE_NAME, kRegion);
   const kSigning = CryptoJS.HmacSHA256(AWS_REQUEST_POLICY_VERSION, kService);

   return kSigning;
}
