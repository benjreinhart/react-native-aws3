# React Native AWS3

React Native AWS3 is a module for uploading files to S3. Unlike other libraries out there, there are no native dependencies.

```
npm install --save react-native-aws3
```

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

let file = {
  // `uri` can also be a file system path (i.e. file://)
  uri: "assets-library://asset/asset.PNG?id=655DBE66-8008-459C-9358-914E1FB532DD&ext=PNG",
  name: "image.png",
  type: "image/png"
}

let options = {
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
  * `acl` - The [Access Control List](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html) of this object. Defaults to `public-read`.
  * `keyPrefix` - Prefix, or path to the file on S3, i.e. `uploads/` (note the trailing slash).
  * `bucket` **required** - Your S3 bucket
  * `region` **required** - The region of your S3 bucket
  * `accessKey` **required** - Your S3 `AWSAccessKeyId`
  * `secretKey` **required** - Your S3 `AWSSecretKey`
  * `sessionToken` - When working w/ Cognito (info below)
  * `successActionStatus` - HTTP response status if successful, defaults to 201.

Returns an object that behaves like a promise. It also has a `progress` method on it which accepts a callback and will invoke the callback with the upload progress.

Example of using the response promise with `progress`:

```javascript
RNS3.put(file, options)
  .then(/* ... */)
  .catch(/* ... */)
  .progress((e) => console.log(e.loaded / e.total));
```

## Cognito

[Cognito](http://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html) is a service that enables you to create unique identities for your users. You can use the Cognito pool id to retrieve a single identity id. This identity id is used to get temporary AWS credentials which include:
 
* `accessKey`
* `secretKey`
* `sessionToken`
 
Just include your `accessKey` and `secretKey` but also include the `sessionToken` in your `options`.

>  If you're making direct HTTPS API requests to AWS, you can sign those requests with the temporary security credentials that you get from the AWS Security Token Service (AWS STS). To do this, you use the access key ID and secret access key that you receive from AWS STS the same way you would use long-term credentials to sign a request. You also add to your API request the session token that you receive from AWS STS. You add the session token to an HTTP header or to a query string parameter named X-Amz-Security-Token.

[More info in the AWS Docs](http://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#RequestWithSTS)

## TODO

- [ ] Support `DeleteObject` and (authenticated) `GetObject` operations.


## License

[MIT](https://github.com/benjreinhart/react-native-aws3/blob/master/LICENSE.txt)
