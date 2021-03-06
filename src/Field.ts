import mapValues from "./utils/mapValues"
import { isObjectLike } from "./utils/isPlainObject"
import { Observable } from "rxjs/Observable"
import "rxjs/add/observable/combineLatest"
import { Subject } from "rxjs/Subject"
import createGetter, { Getter } from "./utils/createGetter"

export interface IField {
  model: string
  focus: boolean
  pending: boolean
  pristine: boolean
  submitted: boolean
  submitFailed: boolean
  retouched: boolean
  touched: boolean
  valid: boolean
  validating: boolean
  validated: boolean
  validity: boolean | { [key: string]: boolean }
  errors: boolean | { [key: string]: boolean }
  value: any
}

const initialField = {
  focus: false,
  pending: false,
  pristine: true,
  submitted: false,
  submitFailed: false,
  retouched: false,
  touched: false,
  valid: true,
  validating: false,
  validated: false,
  validity: {},
  errors: {}
}

function getProp(field: Field | Form, prop: keyof IField): any {
  if (field instanceof Form) {
    return field.form[prop]
  }

  return field[prop]
}

export type ValidityMap = { [key: string]: boolean }
export type Validity = boolean | ValidityMap

export default function isValidityValid(validity: Validity): boolean {
  if (isObjectLike(validity)) {
    return Object.keys(validity).every(key => {
      console.log(key)
      return isValidityValid((validity as ValidityMap)[key])
    })
  }

  return !!validity
}

export class Field {
  public model: string
  public retouched: boolean
  public validated: boolean
  public errors: boolean | { [key: string]: boolean }
  public initialValue: any

  public state$: Subject<IField>
  public state: IField
  private parent: Form | undefined
  private children: IFields | undefined

  constructor(
    parent: Form | undefined,
    form: Form,
    model: string,
    value: any,
    customInitialField?: IField
  ) {
    this.parent = parent
    this.children = form.fields
    this.state$ = new Subject<IField>()

    const field = Object.assign({}, initialField, customInitialField)
    this.state = Object.assign(field, {
      model,
      value,
      initialValue: value
    })
  }

  public change(newValue: any): void {
    if (newValue === this.state.value) return

    this.set({
      value: newValue,
      validated: false,
      retouched:
        this.parent && this.parent.form.submitted ? true : this.state.retouched,
      pristine: false
    })
  }

  public update(newValue: any): IFormUpdates | FormUpdate {
    if (newValue === this.state.value) {
      return "UNCHANGED"
    }

    let updates: IFormUpdates | FormUpdate

    if (!isObjectLike(newValue)) {
      if (this.children) {
        updates = "UPDATE"
      } else {
        updates = this.state.value === newValue ? "UNCHANGED" : "UPDATE"
      }
    } else {
      const children = (this.children = this.children || {})
      updates = {}
      let updated = true

      // Look at existing values
      Object.keys(this.children).forEach(key => {
        const field = children[key]

        if (!(key in newValue)) {
          ;(updates as IFormUpdates)[key] = "DELETE"
          updated = true
        } else {
          const childUpdated = field.form.update(newValue[key])
          ;(updates as IFormUpdates)[key] = childUpdated
          updated = updated || childUpdated !== "UNCHANGED"
        }
      })

      Object.keys(newValue).forEach(key => {
        if ((updates as IFormUpdates)[key]) {
          return // already visited
        }

        ;(updates as IFormUpdates)[key] = "CREATE"
        updated = true

        children[key] = new Form(this.parent, key, newValue[key])
      })

      if (!updated) {
        updates = "UNCHANGED"
      }
    }

    this.change(newValue)

    return updates
  }

  public every(iteratee: (field: Field) => boolean, some?: boolean): boolean {
    const { children } = this

    if (!children) {
      return iteratee(this)
    }

    const method = some ? "some" : "every"

    return Object.keys(this.children)[method](key => {
      if (key === "$form") {
        return method === "some" ? false : true
      }

      const field = children[key]

      return field.form.every(iteratee)
    })
  }

  public some(iteratee: (field: Field) => boolean): boolean {
    return this.every(iteratee, true)
  }

  private set(props: Partial<IField>): void {
    this.state = { ...this.state, ...props }

    this.state$.next(this.state)
  }

  private setParent(props: { [key in keyof Field]?: any }): void {
    if (!this.parent) return

    Object.assign(this.parent.form, props)
  }

  get focus() {
    return this.some(field => field.state.focus)
  }
  set focus(value: boolean) {
    if (this.children || value === this.state.focus) return

    const $form = this.parent ? this.parent.form : undefined

    if (!value) {
      this.set({
        focus: false,
        touched: true
      })
      this.setParent({
        retouched: $form ? $form.submitted || $form.submitFailed : false
      })
    } else {
      this.set({
        focus: true
      })
    }
  }

  get touched() {
    return this.some(field => field.state.touched)
  }
  set touched(value: boolean) {
    if (this.children || value === this.state.touched) return

    const $form = this.parent ? this.parent.form : undefined
    const retouched = $form ? $form.submitted || $form.submitFailed : false

    if (value) {
      this.set({
        touched: true,
        retouched
      })
      this.setParent({
        retouched
      })
    } else {
      this.set({
        focus: false,
        touched: false,
        retouched: false
      })
    }
  }

  get pristine() {
    return this.every(field => field.state.pristine)
  }
  set pristine(value: boolean) {
    if (this.children || value === this.state.pristine) return

    this.set({
      pristine: value
    })
  }

  get validating() {
    return this.state.validating
  }
  set validating(value: boolean) {
    if (this.children || value === this.state.validating) return

    this.set({
      validating: value
    })
  }

  get pending() {
    return this.state.pending
  }
  set pending(pending: boolean) {
    if (this.children || pending === this.state.pending) return

    if (pending) {
      this.set({
        pending,
        submitted: false,
        submitFailed: false,
        retouched: false
      })
    } else {
      this.set({ pending })
    }
  }

  get submitted() {
    return this.state.submitted
  }
  set submitted(submitted: boolean) {
    if (this.children || submitted === this.state.submitted) return

    if (submitted) {
      this.set({
        submitted,
        pending: false,
        submitFailed: false,
        retouched: false
      })
    } else {
      this.set({ submitted })
    }
  }

  get submitFailed() {
    return this.state.submitFailed
  }
  set submitFailed(submitFailed: boolean) {
    if (this.children || submitFailed === this.state.submitFailed) return

    if (submitFailed) {
      this.set({
        submitFailed,
        pending: false,
        submitted: false,
        touched: true,
        retouched: false
      })
    } else {
      this.set({ submitFailed })
    }
  }

  get validity() {
    return this.state.validity
  }
  set validity(validity: Validity) {
    if (this.children || validity === this.state.validity) return

    this.set({
      validity,
      validating: false
    })
  }

  get valid(): boolean {
    const fieldValid = isValidityValid(this.state.validity)

    if (!this.children) {
      return fieldValid
    }

    return fieldValid && this.every(field => field.valid)
  }

  get value(): any {
    return this.state.value
  }
}

export interface IFields {
  [key: string]: Form
}

export type FormUpdate = "UNCHANGED" | "CREATE" | "UPDATE" | "DELETE"

export interface IFormUpdates {
  [key: string]: FormUpdate | IFormUpdates
}

export interface IFieldMap {
  $form: Field
  [key: string]: Field | IFieldMap
}

export class Form {
  public form: Field
  public fields: IFields | undefined

  constructor(
    parent: Form | undefined,
    model: string,
    value: any,
    customInitialField?: IField
  ) {
    if (isObjectLike(value)) {
      this.fields = mapValues(value, (subValue, key) => {
        return new Form(this, key, subValue, customInitialField)
      })
    }

    this.form = new Field(parent, this, model, value, customInitialField)
  }

  get fieldMap(): IFieldMap {
    const fieldMap: IFieldMap = {
      $form: this.form
    }
    const { fields } = this

    if (!fields) {
      return fieldMap
    }

    Object.keys(fields as IFields).forEach(key => {
      fieldMap[key] = fields[key].fieldMap
    })

    return fieldMap
  }

  public get(model: Getter<Field>): Field {
    const getter =
      typeof model === "function" ? model : createGetter<Field>(model)

    const fieldMap = getter(this.fieldMap)

    return fieldMap.$form
  }
}
