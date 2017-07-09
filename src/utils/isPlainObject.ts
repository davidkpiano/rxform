// Adapted from https://github.com/jonschlinkert/is-plain-object
export function isObjectLike(val: any): boolean {
  return val != null && typeof val === "object"
}

function isObject(val: any): boolean {
  return isObjectLike(val) && Array.isArray(val) === false
}

function isObjectObject(o: any): boolean {
  return (
    isObject(o) === true &&
    Object.prototype.toString.call(o) === "[object Object]"
  )
}

export default function isPlainObject(o: any): boolean {
  if (isObjectObject(o) === false) return false

  // If has modified constructor
  const ctor = o.constructor
  if (typeof ctor !== "function") return false

  // If has modified prototype
  const prot = ctor.prototype
  if (isObjectObject(prot) === false) return false

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty("isPrototypeOf") === false) {
    return false
  }

  // Most likely a plain Object
  return true
}
