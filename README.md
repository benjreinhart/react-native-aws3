# React Native AWS3

React Native AWS3 is a module for uploading files to S3. Unlike other libraries out there, there are no native dependencies.

```
npm install --save react-native-aws3
```

[![build status](https://circleci.com/gh/benjreinhart/react-native-aws3.svg?style=shield&circle-token=c7cb5ba4654c9d66bbfeac9809e50aa0fbf0af09)](https://circleci.com/gh/benjreinhart/react-native-aws3)
[![npm version](https://img.shields.io/npm/v/react-native-aws3.svg?style=flat-square)](https://www.npmjs.com/package/react-native-aws3)
[![npm downloads](https://img.shields.io/npm/dm/react-native-aws3.svg?style=flat-square)](https://www.npmjs.com/package/react-native-aws3)

## Note on S3 user permissions

The user associated with the `accessKey` and `secretKey` you use must have the appropriate permissions assigned to them. My user's IAM policy looks like:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1458840156000",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:GetObjectVersion",
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:PutObjectVersionAcl"
            ],
            "Resource": [
                "arn:aws:s3:::my-bucket/uploads/*"
            ]
        }
    ]
}
```

## Example

```javascript
import { RNS3 } from 'react-native-aws3';

const file = {
  // `uri` can also be a file system path (i.e. file://)
  uri: "assets-library://asset/asset.PNG?id=655DBE66-8008-459C-9358-914E1FB532DD&ext=PNG",
  name: "image.png",
  type: "image/png"
}

const options = {
  keyPrefix: "uploads/",
  bucket: "your-bucket",
  region: "us-east-1",
  accessKey: "your-access-key",
  secretKey: "your-secret-key",
  successActionStatus: 201
}

RNS3.put(file, options).then(response => {
  if (response.status !== 201)
    throw new Error("Failed to upload image to S3");
  console.log(response.body);
  /**
   * {
   *   postResponse: {
   *     bucket: "your-bucket",
   *     etag : "9f620878e06d28774406017480a59fd4",
   *     key: "uploads/image.png",
   *     location: "https://your-bucket.s3.amazonaws.com/uploads%2Fimage.png"
   *   }
   * }
   */
});
```

## Usage

### put(file, options)

Upload a file to S3.

Arguments:

1. `file`
  * `uri` **required** - File system URI, can be assets library path or `file://` path
  * `name` **required** - The name of the file, will be stored as such in S3
  * `type` **required** - The mime type, also used for `Content-Type` parameter in the S3 post policy
2. `options`
  * `acl` - The [Access Control List](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html) of this object. Defaults to `public-read`
  * `keyPrefix` - Prefix, or path to the file on S3, i.e. `uploads/` (note the trailing slash)
  * `bucket` **required** - Your S3 bucket
  * `region` **required** - The region of your S3 bucket
  * `accessKey` **required** - Your S3 `AWSAccessKeyId`
  * `secretKey` **required** - Your S3 `AWSSecretKey`
  * `successActionStatus` - HTTP response status if successful, defaults to 201
  * `awsUrl` - [AWS S3 url](http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region). Defaults to `s3.amazonaws.com`
  * `timeDelta` - Devices time offset from world clock in milliseconds, defaults to 0

Returns an object that wraps an `XMLHttpRequest` instance and behaves like a promise, with the following additional methods:

* `progress` - accepts a callback which will be called with an event representing the progress of the upload. Event object is of shape
  * `loaded` - amount uploaded
  * `total` - total amount to upload
  * `percent` - number between 0 and 1 representing the percent completed
* `abort` - aborts the xhr instance

Examples:
```javascript
RNS3.put(file, options)
  .progress((e) => console.log(e.loaded / e.total)); // or console.log(e.percent)

RNS3.put(file, option)
  .abort();
```

## TODO

- [ ] Support `DeleteObject` and (authenticated) `GetObject` operations.


## License

[MIT](https://github.com/benjreinhart/react-native-aws3/blob/master/LICENSE.txt)
