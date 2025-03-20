type JsonPrimitive = string | number | boolean | null | undefined
type JsonArray = JsonValue[]
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonArray | JsonObject

// Recursively converts all properties to JSON primitives
export type ToJsonType<T> = T extends Date
  ? string
  : T extends Map<infer K, infer V>
    ? Record<string, ToJsonType<V>>
    : T extends Set<infer U>
      ? ToJsonType<U>[]
      : T extends Array<infer U>
        ? ToJsonType<U>[]
        : T extends object
          ? { [K in keyof T]: ToJsonType<T[K]> }
          : T
