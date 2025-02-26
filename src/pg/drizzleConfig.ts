import { config } from '@/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: config.pg.schema,
  out: config.pg.migrations.out,
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
