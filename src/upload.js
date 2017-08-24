/**
 * RNS3
 */

import { Request } from './Request'
import { setBodyAsParsedXML } from './utils';

const AWS_DEFAULT_S3_HOST = 's3.amazonaws.com'

export class RNS3 {
  static put(file, options, policy) {
    if (!policy) {
      throw new Error('missing policy');
    }
    const url = `https://${options.bucket}.${options.awsUrl || AWS_DEFAULT_S3_HOST}`
    const method = "POST"

    return Request.create(url, method, policy)
      .set("file", file)
      .send()
      .then(setBodyAsParsedXML)
  }
}
