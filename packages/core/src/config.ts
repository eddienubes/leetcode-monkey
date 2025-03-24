import path from 'node:path'

const migrationsPath = path.resolve(__dirname, './pg/migrations')
const dbSchema = path.resolve(__dirname, './pg/schema.ts')

console.log(`Migrations path: ${migrationsPath}`)
console.log(`Schema path: ${dbSchema}`)

export const config = {
  bot: {
    token: process.env.TG_BOT_TOKEN as string,
  },
  pg: {
    url: process.env.PG_URL as string,
    migrations: {
      schema: 'public',
      table: 'drizzle_migrations',
      out: migrationsPath,
    },
    schema: dbSchema,
  },
  cron: {
    lcCronJobInterval: process.env.CRON_LC_JOB_INTERVAL as string,
    tgSubmissionsCronJobInterval: process.env
      .CRON_LC_TG_NOTIFICATION_INTERVAL as string,
    removeOnComplete: 100,
    removeOnFail: 100,
  },
  redis: {
    host: process.env.REDIS_HOST as string,
    port: parseInt(process.env.REDIS_PORT as string, 10),
    user: process.env.REDIS_USER as string,
    password: process.env.REDIS_PASSWORD as string,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    projectId: process.env.GOOGLE_PROJECT_ID as string,
  },
  ui: {
    baseUrl: process.env.UI_BASE_URL as string,
  }
}
