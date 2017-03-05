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

    // always required
    assert(options.accessKey, "Must provide `accessKey` option with your AWSAccessKeyId");
    assert(options.key, "Must provide `key` option with the object key");
    assert(options.contentType, "Must provide `contentType` option with the object content type");

    if (options.presign) {
      assert(options.acl, "Must provide 'acl' with presign option");
      assert(options.policy, "Must provide 'policy' with presign option");
      assert(options.signature, "Must provide 'signature' with presign option");
      return formatPolicyForPresign(options);
    }

    assert(options.secretKey, "Must provide `secretKey` option with your AWSSecretKey");
    assert(options.bucket, "Must provide `bucket` option with your AWS bucket name");
    assert(options.region, "Must provide `region` option with your AWS region");

    let policyParams = getPolicyParams(options);
    let policy = formatPolicyForEncoding(policyParams);
    let base64EncodedPolicy = getEncodedPolicy(policy);
    let signature = getSignature(base64EncodedPolicy, policyParams);

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
const getExpirationDate = (timeDelta) => {
  return new Date(
    (new Date).getTime() + FIVE_MINUTES - timeDelta
  ).toISOString();
}

const getPolicyParams = (options) => {
  let timeDelta = (options.timeDelta || 0);
  let date = getDate();
  let expiration = getExpirationDate(timeDelta);

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
    "X-Amz-Date": options.date.amzDate,
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
       {"x-amz-date": policy.date.amzDate}
    ]
  }
}

const formatPolicyForPresign = (options) => {
  return {
    "key": options.key,
    "AWSAccessKeyId": options.accessKey,
    "acl": options.acl,
    "policy": options.policy,
    "signature": options.signature,
    "Content-Type": options.contentType,
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
   let kDate = CryptoJS.HmacSHA256(options.date.yymmdd, "AWS4" + options.secretKey);
   let kRegion = CryptoJS.HmacSHA256(options.region, kDate);
   let kService = CryptoJS.HmacSHA256(AWS_SERVICE_NAME, kRegion);
   let kSigning = CryptoJS.HmacSHA256(AWS_REQUEST_POLICY_VERSION, kService);

   return kSigning;
}
