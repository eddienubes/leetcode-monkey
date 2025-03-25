import { createProvidersContainer, Injectable } from "@/common/container";

@Injectable()
class DepC {
  constructor() {}
}

const id = Symbol()
const value = 'I am a value'

@Injectable(DepC, id)
class DepB {
  constructor(
    readonly depC: DepC,
    readonly valueDep: string,
  ) {}
}

@Injectable()
class DepA {
  constructor() {}
}

@Injectable(DepA, DepB)
class TestClass {
  constructor(
    private readonly depA: DepA,
    private readonly depB: DepB,
  ) {}
}

describe('Container', () => {
  it('should create ioc container', async () => {
    const container = createProvidersContainer([
      DepA,
      DepB,
      DepC,
      TestClass,
      {
        id,
        value,
      },
    ])

    container.build()

    const instance = container.get(TestClass)

    expect(instance).toBeInstanceOf(TestClass)
    expect(instance).toHaveProperty('depA')
    expect(instance).toHaveProperty('depB')

    const depB = container.get(DepB)

    expect(depB.valueDep).toEqual(value)
  })
})
