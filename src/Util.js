/**
 * Util
 */

export const assert = (object, message) => {
  if (null == object) throw new Error(message);
}
