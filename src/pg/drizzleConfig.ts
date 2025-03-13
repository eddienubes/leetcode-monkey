import { config } from '@/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: config.pg.schema,
  // there's a bug in drizzle-kit that doesn't allow to use the out path with a leading slash
  out: 'src/pg/migrations',
  dialect: 'postgresql',
  verbose: true,
  migrations: {
    table: config.pg.migrations.table,
    schema: config.pg.migrations.schema,
  },
  dbCredentials: {
    url: config.pg.url,
  },
})
