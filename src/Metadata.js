/**
 * Metadata
 */

const metadataPrefix = 'x-amz-meta-'; // Lowercase due to aws requirements

export class Metadata {
  static generate(options) {

    let metadata = {};

    if (options.metadata) {
      Object.keys(options.metadata).forEach((k) => { metadata[metadataPrefix + k] = options.metadata[k] });
    }

    return metadata;

  }
}
