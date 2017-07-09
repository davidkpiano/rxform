// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

import { Observable } from "rxjs/Observable"
import { Subject } from "rxjs/Subject"
import { Form } from "./Field"

interface IAction {
  type: string
  [key: string]: any
}

class RxForm extends Form {
  constructor(initialState: object) {
    super(undefined, "", initialState)
  }
}

export default RxForm
