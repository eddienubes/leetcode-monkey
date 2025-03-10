export const config = {
  bot: {
    token: process.env.TG_BOT_TOKEN as string,
  },
  pg: {
    url: process.env.PG_URL as string,
    migrations: {
      schema: 'public',
      table: 'drizzle_migrations',
      out: 'src/pg/migrations',
    },
    schema: './src/pg/schema.ts',
  },
  cron: {
    lcCronJobInterval: process.env.CRON_lc_JOB_INTERVAL as string,
  },
  redis: {
    host: process.env.REDIS_HOST as string,
    port: parseInt(process.env.REDIS_PORT as string, 10),
  },
}
