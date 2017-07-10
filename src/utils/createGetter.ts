export interface IFieldMap<T> {
  $form: T
  [key: string]: T | IFieldMap<T>
}

export type Getter<T> = (collection: IFieldMap<T>) => IFieldMap<T>

export default function createGetter<T>(model: string): Getter<T> {
  /** Used to match property names within property paths. */
  const reLeadingDot = /^\./
  const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g

  /** Used to match backslashes in property paths. */
  const reEscapeChar = /\\(\\)?/g

  const path: string[] = []
  if (reLeadingDot.test(model)) {
    path.push("")
  }
  model.replace(rePropName, function(match, num, quote, str) {
    path.push(quote ? str.replace(reEscapeChar, "$1") : num || match)
    return ""
  })

  return collection => {
    let marker = collection

    for (const key of path) {
      marker = marker[key] as IFieldMap<T>
    }

    return marker
  }
}
