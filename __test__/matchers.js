export const toBeEmptyObject = received =>
  0 === Object.keys(received).length
    ? { pass: true, message: "expected object not to be empty" }
    : { pass: false, message: "expected object to be empty" }
