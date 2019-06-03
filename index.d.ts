declare module 'react-native-aws3' {
  interface File {
    uri: string
    name: string
    type: string
  }

  interface Options {
    acl?: string
    keyPrefix?: string
    bucket: string
    region: string
    accessKey: string
    secretKey: string
    successActionStatus?: number
    awsUrl?: string
    timeDelta?: number
  }

  export class RNS3 {
    put(file: File, option: Options)
  }
}
