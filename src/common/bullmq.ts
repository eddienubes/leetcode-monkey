import { config } from '@/config'

export const connection = {
  host: config.redis.host,
  port: config.redis.port,
  username: config.redis.user,
  password: config.redis.password,
}

export const defaultJobOptions = {
  removeOnComplete: config.cron.removeOnComplete,
  removeOnFail: config.cron.removeOnFail,
}
