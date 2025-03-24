import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'
import postgres from 'postgres'
import { getTableColumns, SQL, sql } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { config } from '@/config'
import { Injectable, Lifecycle } from "@/common";

export type PostgresDatabase = PostgresJsDatabase<typeof schema>

@Injectable()
export class PgService implements Lifecycle {
  private readonly client: PostgresDatabase
  private readonly connection
  private readonly storage = new AsyncLocalStorage<PostgresDatabase>()

  constructor() {
    // this.logger.setContext(PostgresService.name);
    this.connection = postgres(config.pg.url)

    this.client = drizzle(this.connection, {
      schema,
    })
  }

  /**
   * TODO: Implement locking
   */
  async migrate(): Promise<void> {
    await migrate(this.client, {
      migrationsFolder: config.pg.migrations.out,
      migrationsTable: config.pg.migrations.table,
      migrationsSchema: config.pg.migrations.schema,
    })
  }

  getClient(): PostgresDatabase {
    return this.getTransaction() || this.client
  }

  getTransaction(): PostgresDatabase | null {
    return this.storage.getStore() ?? null
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection.end()
  }

  async onModuleInit(): Promise<void> {
    console.info('Connecting to postgres...')

    const query = sql`
            SELECT version()
        `

    const hits = await this.client.execute(query)

    console.info(`Connected successfully, version: ${hits[0].version}`)

    await this.migrate()
  }

  /**
   * Returns type-safe schema for upserts
   * @param table
   * @param except
   */
  conflictUpdateAllExcept<
    T extends PgTable,
    E extends (keyof T['$inferInsert'])[],
  >(table: T, except: E) {
    const columns = getTableColumns(table)
    const updateColumns = Object.entries(columns).filter(
      ([col]) => !except.includes(col as E[number]),
    )

    return updateColumns.reduce(
      (acc, [colName, table]) => ({
        ...acc,
        [colName]: sql.raw(`excluded.${table.name}`),
      }),
      {},
    ) as Omit<Record<keyof typeof table.$inferInsert, SQL>, E[number]>
  }

  async wrapInTx<T>(cb: () => Promise<T>): Promise<T> {
    return await PgService.wrapInTxImpl(this.client, this.storage, cb)
  }

  /**
   * Drop schema, only allowed in development environment
   */
  async dropSchema(): Promise<void> {
    // if (
    //   !['development', 'test'].includes(
    //     this.config.get('server.nodeEnv')
    //   ) ||
    //   !this.config.get('postgres.host').includes('localhost')
    // ) {
    //   throw new Error(
    //     'Database reset is only allowed in development environment'
    //   );
    // }

    // We're using raw (unsafe) here since DDL statements cannot have parameters
    const hits = await this.connection.unsafe(`
            SELECT exists(select schema_name FROM information_schema.schemata WHERE schema_name = 'public') 
        `)
    const exists = hits?.[0]?.exists

    if (exists) {
      await this.connection.unsafe(`DROP SCHEMA public CASCADE;`)
      await this.connection.unsafe(`CREATE SCHEMA public;`)
    }
  }

  private static async wrapInTxImpl<R>(
    client: PostgresDatabase,
    storage: AsyncLocalStorage<PostgresDatabase>,
    cb: () => Promise<R>,
  ): Promise<R> {
    const res = await client.transaction(async (tx) => {
      return await storage.run(tx, async () => {
        return await cb()
      })
    })

    return res
  }

}
