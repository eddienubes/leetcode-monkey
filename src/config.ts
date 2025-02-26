export const config = {
  bot: {
    token: process.env.TG_BOT_TOKEN as string,
  },
  pg: {
    url: process.env.PG_URL as string,
    migrations: {
      schema: 'public',
      table: 'drizzle_migrations',
      out: 'src/pg/migrations'
    },
    schema: './src/pg/schema.ts',
  },
}
