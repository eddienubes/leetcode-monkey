import { ClassConstructor } from '@/common/types'
import { isConstructorFunction } from '@/common/utils'

// @ts-ignore polyfill
// noinspection JSConstantReassignment
Symbol.metadata ??= Symbol('Symbol.metadata')

export type Lifecycle = {
  onModuleDestroy?: () => Promise<void>
  onModuleInit?: () => Promise<void>
}

export type ClassDependency = {
  new (...args: any[]): any
}

export type TypedClassDependency = {
  type: 'class'
  id: ClassDependency
}

export type ValueDependency = string | symbol

export type TypedValueDependency = {
  type: 'value'
  id: ValueDependency
}

/**
 * Use input to assign dependencies to each provider
 */
export type Dependency = ClassDependency | ValueDependency
/**
 * Types operated in the container
 */
export type TypedDependency = (TypedClassDependency | TypedValueDependency) & {
  name: string
}
export type TypedDependencyId = TypedDependency['id']
export type ClassProvider = ClassConstructor<any>
export type ValueProvider = {
  id: string | symbol
  value: unknown
}
/**
 * User input to list all providers. Each provider has dependencies on their own.
 * FYI: Value provider dependency is not supported yet.
 */
export type Provider = ClassProvider | ValueProvider

export type ClassMetadata = {
  __dependencies: (Dependency | (() => Dependency))[]
}

export const Injectable =
  (...deps: (Dependency | (() => Dependency))[]) =>
  (target: ClassConstructor<unknown>, context: ClassDecoratorContext) => {
    const meta = context.metadata as ClassMetadata
    meta.__dependencies = deps
  }

/**
 * Create a dead simple dependency injection container.
 */
export const createProvidersContainer = (providers: Provider[]) => {
  const dependencies = new Map<TypedDependencyId, TypedDependency[]>()
  const providersMap = new Map<TypedDependencyId, Provider>()
  const instances = new Map<TypedDependencyId, Lifecycle>()

  for (const provider of providers) {
    providersMap.set(providerToDependency(provider).id, provider)

    // it's a value provider
    // Container doesn't support deps of a value providers just yet.
    if ('id' in provider) {
      dependencies.set(providerToDependency(provider).id, [])
      continue
    }

    const meta = provider[Symbol.metadata as keyof typeof provider] as
      | ClassMetadata
      | undefined

    if (!meta?.__dependencies) {
      const name = getProviderName(provider)
      throw new Error(`Provider ${name} is not decorated with @Injectable`)
    }

    const deps: TypedDependency[] = []

    // Categorise dependencies at this point
    for (const dep of meta.__dependencies) {
      if (isConstructorFunction(dep)) {
        deps.push({
          type: 'class',
          name: dep.name,
          id: dep,
        })
        continue
      }

      if (typeof dep === 'function') {
        const fnDep = dep()
        if (isConstructorFunction(fnDep)) {
          deps.push({
            type: 'class',
            name: fnDep.name,
            id: fnDep,
          })
          continue
        }

        deps.push({
          type: 'value',
          name: fnDep.toString(),
          id: fnDep,
        })
        continue
      }

      deps.push({
        type: 'value',
        name: dep.toString(),
        id: dep,
      })
    }

    dependencies.set(provider, deps)
  }

  const buildDependency = (
    dependency: TypedDependency,
    graph: Map<TypedDependencyId, TypedDependency>,
    globalDepsMap: Map<TypedDependencyId, TypedDependency[]>,
  ): Lifecycle => {
    if (graph.has(dependency.id)) {
      throw new Error(
        `Circular dependency detected: ${dependencyGraphToStr(graph, true)}`,
      )
    }

    if (!globalDepsMap.has(dependency.id)) {
      throw new Error(
        `Provider ${dependency.name} is not registered in the container, but required by ${dependencyGraphToStr(graph)}`,
      )
    }

    graph.set(dependency.id, dependency)

    const dependsOn = globalDepsMap.get(dependency.id) || []

    if (!dependsOn.length) {
      return inferValueFromTypedDependency(dependency, providersMap)
    }

    const args = []

    for (const dep of dependsOn) {
      const value = buildDependency(dep, graph, globalDepsMap)

      args.push(value)
    }

    const instance = inferValueFromTypedDependency(
      dependency,
      providersMap,
      ...args,
    )

    return instance
  }

  function get<T extends ClassDependency>(p: T): InstanceType<T>
  function get<R extends unknown>(p: string | symbol): R
  function get(p: ClassDependency | string | symbol): unknown {
    const instance = instances.get(p)

    const name = getDependencyName(p)

    if (!instance) {
      throw new Error(`Provider ${name} is not registered in the container`)
    }

    return instance
  }

  return {
    get,
    build() {
      for (const provider of providers) {
        const dependency = providerToDependency(provider)
        const instance = buildDependency(dependency, new Map(), dependencies)

        instances.set(dependency.id, instance)
      }
      return this
    },
    async start() {
      for (const instance of instances.values()) {
        await instance.onModuleInit?.()
      }
    },
    async destroy() {
      for (const instance of instances.values()) {
        instance.onModuleDestroy?.()
      }
    },
  }
}

const getDependencyName = (p: Dependency): string => {
  if (typeof p === 'string') {
    return p
  }

  return p.toString()
}

const getProviderName = (p: Provider): string => {
  if ('id' in p) {
    return p.id.toString()
  }

  return p.name
}

const inferValueFromTypedDependency = (
  d: TypedDependency,
  providersMap: Map<TypedDependencyId, Provider>,
  ...args: any[]
): Lifecycle => {
  const value = providersMap.get(d.id)!

  if (d.type === 'class') {
    const cls = value as ClassProvider
    return new cls(...args)
  }

  const valueProvider = value as ValueProvider
  return valueProvider.value as Lifecycle
}

const dependencyGraphToStr = (
  graph: Map<TypedDependencyId, TypedDependency>,
  repeatStart = false,
): string => {
  const values = Array.from(graph.values())

  if (repeatStart) {
    values.push(values[0])
  }

  return values.map((v) => v.name).join(' -> ')
}

const providerToDependency = (p: Provider): TypedDependency => {
  if (isConstructorFunction(p)) {
    return {
      name: p.name,
      type: 'class',
      id: p,
    }
  }

  return {
    name: p.id.toString(),
    type: 'value',
    id: p.id,
  }
}
