import { Request } from '../src/Request'

const ClassFactory = (methods, properties = {}, instances = []) =>
  class {
    constructor(...args) {
      Object.assign(this, properties)
      Object.assign(Object.getPrototypeOf(this), methods)
      instances.push(this)
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
      const xmlHttpRequestInstances = []
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn() }, {}, xmlHttpRequestInstances)

      new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')

      const xhr = xmlHttpRequestInstances[0]
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

      const formDatainstances = []
      Request.FormData = ClassFactory({}, {}, formDatainstances)

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      request.send()

      const formData = formDatainstances[0]
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
      const xmlHttpRequestInstances = []
      Request.XMLHttpRequest = ClassFactory({ open: jest.fn() }, { upload: {} }, xmlHttpRequestInstances)

      const request = new Request('https://my-s3-bucket.s3.amazonaws.com', 'POST')
      const progressFn = jest.fn()
      request.progress(progressFn)

      const xhr = xmlHttpRequestInstances[0]
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
})
