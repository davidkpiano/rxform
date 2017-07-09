import RxForm from "../src/RxForm"

/**
 * Dummy test
 */
describe("primitive values", () => {
  const valuesDict = {
    number: 42,
    string: "a string",
    "empty string": "",
    boolean: true
  }

  Object.keys(valuesDict).forEach(key => {
    it('creates a reactive form for the type "' + key + '"', () => {
      const form = new RxForm(valuesDict[key])

      expect(form.form.value).toEqual(valuesDict[key])
      expect(form.fields).toBeUndefined()
    })
  })
})
