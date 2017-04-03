import { toBeEmptyObject } from './matchers'
import { Request } from '../src/Request'

expect.extend({ toBeEmptyObject })

const ClassFactory = (methods, properties = {}) =>
  class {
    constructor(...args) {
      Object.assign(this, properties)
      Object.assign(Object.getPrototypeOf(this), methods)
    }
  }

describe('Request', () => {
  const originalFormData = Request.FormData
  const origiginalXMLHttpRequest = Request.XMLHttpRequest

  beforeEach(() => {
    Request.FormData = ClassFactory()
    Request.XMLHttpRequest = ClassFactory({ open: Function() })
  })

  afterEach(() => {
    Request.FormData = originalFormData
    Request.XMLHttpRequest = origiginalXMLHttpRequest
  })

  describe('.create', () => {
    it('creates a new instance of Request with arguments', () => {
      const request = Request.create('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      expect(request).toBeInstanceOf(Request)
    })
  })

  describe('constructor', () => {
    it('correctly opens the xhr', () => {
      const open = jest.fn()
      Request.XMLHttpRequest = ClassFactory({ open })

      new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')

      expect(open).toHaveBeenCalledTimes(1)
      expect(open).toBeCalledWith('POST', 'https://my-s3-bucket.s3.amazonaws.com')
    })

    it('initializes form data attributes', () => {
      const append = jest.fn()
      Request.FormData = ClassFactory({ append })

      new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST', { key1: 'value1', key2: 'value2' })

      expect(append).toHaveBeenCalledTimes(2)
      expect(append).toBeCalledWith('key1', 'value1')
      expect(append).toBeCalledWith('key2', 'value2')
    })

    it('initializes headers', () => {
      const setRequestHeader = jest.fn()
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn(), setRequestHeader })

      new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST', {}, { header1: 'value1', header2: 'value2'})

      expect(setRequestHeader).toHaveBeenCalledTimes(2)
      expect(setRequestHeader).toBeCalledWith('header1', 'value1')
      expect(setRequestHeader).toBeCalledWith('header2', 'value2')
    })

    it('registers onload and onerror callbacks', () => {
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn() })

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')

      const xhr = request._xhr
      expect(xhr).not.toBeUndefined()
      expect(xhr.onload).toBeInstanceOf(Function)
      expect(xhr.onerror).toBeInstanceOf(Function)
    })

    it('initializes a promise', () => {
      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      expect(request._promise).toBeInstanceOf(Promise)
    })
  })

  describe('#header', () => {
    it('sets request headers on the xhr', () => {
      const setRequestHeader = jest.fn()
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn(), setRequestHeader })

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      request.header('header1', 'value1')
      request.header('header2', 'value2')

      expect(setRequestHeader).toHaveBeenCalledTimes(2)
      expect(setRequestHeader).toBeCalledWith('header1', 'value1')
      expect(setRequestHeader).toBeCalledWith('header2', 'value2')
    })
  })

  describe('#set', () => {
    it('sets key/value pairs on formData', () => {
      const append = jest.fn()
      Request.FormData = ClassFactory({ append })

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      request.set('key1', 'value1')
      request.set('key2', 'value2')

      expect(append).toHaveBeenCalledTimes(2)
      expect(append).toBeCalledWith('key1', 'value1')
      expect(append).toBeCalledWith('key2', 'value2')
    })
  })

  describe('#send', () => {
    it('sends the xhr request', () => {
      const send = jest.fn()
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn(), send })

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      request.send()

      const formData = request._formData
      expect(send).toHaveBeenCalledTimes(1)
      expect(send).toBeCalledWith(formData)
    })
  })

  describe('#abort', () => {
    it('aborts the xhr', () => {
      const abort = jest.fn()
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn(), abort })

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      request.abort()

      expect(abort).toHaveBeenCalledTimes(1)
    })
  })

  describe('#progress', () => {
    it('sets onprogress callback on the xhr', () => {
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn() }, { upload: {} })

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      const progressFn = jest.fn()
      request.progress(progressFn)

      const xhr = request._xhr
      xhr.upload.onprogress({ loaded: 10, total: 50 })

      expect(progressFn).toHaveBeenCalledTimes(1)
      expect(progressFn.mock.calls[0][0]).toMatchObject({ loaded: 10, total: 50, percent: 0.2 })
    })
  })

  describe('#then', () => {
    it('delegates to the internal promise', () => {
      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')

      request._promise = { then: jest.fn(() => request._promise) }

      const callbackFn1 = jest.fn()
      const callbackFn2 = jest.fn()
      const callbackFn3 = jest.fn()

      request
        .then(callbackFn1)
        .then(callbackFn2, callbackFn3)

      expect(request._promise.then).toHaveBeenCalledTimes(2)
      expect(request._promise.then).toBeCalledWith(callbackFn1)
      expect(request._promise.then).toBeCalledWith(callbackFn2, callbackFn3)
    })
  })

  describe('#catch', () => {
    it('delegates to the internal promise', () => {
      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')

      request._promise = { catch: jest.fn(() => request._promise) }

      const callbackFn1 = jest.fn()
      const callbackFn2 = jest.fn()

      request
        .catch(callbackFn1)
        .catch(callbackFn2)

      expect(request._promise.catch).toHaveBeenCalledTimes(2)
      expect(request._promise.catch).toBeCalledWith(callbackFn1)
      expect(request._promise.catch).toBeCalledWith(callbackFn2)
    })
  })

  describe('when xhr onload is called', () => {
    const XHR_HEADERS = {
      'Server': 'AmazonS3',
      'Content-Type': 'application/xml',
      'Location': 'https://rnaws3-uploads.s3.us-east-2.amazonaws.com/uploads%2Fimage.jpg',
      'x-amz-request-id': 'ED7D980C128FBF54',
      'Date': 'Sat, 01 Apr 2017 19:53:20 GMT',
      'x-amz-id-2': '9ijY28x7WwOT8PQChPVu6928zQ14cNQFEfSTygshpL+h7unaZASKgpyZ4RwYPBSKFi7EffhK3C4=',
      'Content-Length': '264',
      'Etag': '"afba579120c3ed942f55c8ca50fe39fc"'
    }

    const XHR_HEADERS_STRING = Object.keys(XHR_HEADERS).map(k => `${k}: ${XHR_HEADERS[k]}`).join('\r\n')

    const XHR_RESPONSE_TEXT = '<?xml version="1.0" encoding="UTF-8"?>\n<PostResponse><Location>https://rnaws3-uploads.s3.us-east-2.amazonaws.com/uploads%2Fimage.jpg</Location><Bucket>rnaws3-uploads</Bucket><Key>uploads/image.jpg</Key><ETag>"afba579120c3ed942f55c8ca50fe39fc"</ETag></PostResponse>'

    it('resolves the promise with a formatted response', () => {
      Request.XMLHttpRequest = ClassFactory(
        {
          open: jest.fn(),
          getResponseHeader: header => XHR_HEADERS[header],
          getAllResponseHeaders: () => XHR_HEADERS_STRING
        },
        {
          status: 201,
          responseText: XHR_RESPONSE_TEXT
        }
      )

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST').then(response => {
        expect(response).toHaveProperty('text', XHR_RESPONSE_TEXT)
        expect(response).toHaveProperty('status', 201)
        expect(response.headers).toMatchObject(XHR_HEADERS)
      })

      request._xhr.onload()

      return request
    })
  })

  describe('when xhr onerror is called', () => {
    const XHR_RESPONSE_TEXT = '<?xml version="1.0" encoding="UTF-8"?>\n<PostResponse><Location>https://rnaws3-uploads.s3.us-east-2.amazonaws.com/uploads%2Fimage.jpg</Location><Bucket>rnaws3-uploads</Bucket><Key>uploads/image.jpg</Key><ETag>"afba579120c3ed942f55c8ca50fe39fc"</ETag></PostResponse>'

    it('rejects the promise with a formatted response', () => {
      Request.XMLHttpRequest = ClassFactory(
        {
          open: jest.fn(),
          getResponseHeader: header => {},
          getAllResponseHeaders: () => ''
        },
        {
          status: 0,
          responseText: XHR_RESPONSE_TEXT
        }
      )

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST').catch(response => {
        expect(response).toHaveProperty('text', XHR_RESPONSE_TEXT)
        expect(response).toHaveProperty('status', 0)
        expect(response.headers).toBeEmptyObject()
      })

      request._xhr.onerror()

      return request
    })
  })
})
