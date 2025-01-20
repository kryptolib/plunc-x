export namespace EntityAssertToolkit {

    /** Asserts that a value has length of 32 */
    export function isLength32(value: string): asserts value is string & { length: 32 } {
      if (value.length !== 32) {
        throw new Error()
      }
    }
    
    /** Asserts that the value is an Entity ID */
    export function isEntityId(id: unknown): asserts id is string & { length: 32 } {
      const regex = /^[a-zA-Z0-9]+$/
      if (typeof id!=='string') {
        throw new Error()
      }
      if (!regex.test(id)) {
        let error = 'Value provided to entity_id contains illegal characters'
        throw new Error(error)
      }
      isLength32(id)
    }
  }