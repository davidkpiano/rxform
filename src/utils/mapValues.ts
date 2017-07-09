export default function mapValues<T, V>(
  object: { [key: string]: V },
  iteratee: (value: V, key: string, object: object) => T
): { [key: string]: T } {
  const result: { [key: string]: T } = {}

  Object.keys(object || {}).forEach(key => {
    result[key] = iteratee(object[key], key, object)
  })

  return result
}
