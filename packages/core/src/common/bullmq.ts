import {
  Queue,
  QueueOptions,
  WorkerOptions,
  Worker,
  Job,
  BulkJobOptions,
} from 'bullmq'
import { config } from '@/config'
import { ToJsonType } from '@/common/types'

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  username: config.redis.user,
  password: config.redis.password,
}

const defaultJobOptions = {
  removeOnComplete: config.cron.removeOnComplete,
  removeOnFail: config.cron.removeOnFail,
}

export type JobOfQueue<T> = Job<ToJsonType<T>>
type ConnectOptions = QueueOptions & WorkerOptions
type WorkerOrTicker<T> = (job: JobOfQueue<T>) => Promise<void>

/**
 * BullQueue manager base class to support type safety for payload as well as connectivity
 * and other methods in a single place.
 */
export abstract class BullQueue {
  static queueName: string

  static connect<T extends typeof BullQueue>(
    this: T,
    workerOrTicker?: WorkerOrTicker<InstanceType<T>>,
    options?: QueueOptions & WorkerOptions,
  ) {
    const ctor = this.prototype.constructor as any
    const queueName = ctor.queueName
    if (!queueName) {
      throw new Error(
        `Queue name is not defined for ${this.name}, please set it using static queueName`,
      )
    }

    options ??= { connection }
    options.defaultJobOptions ??= defaultJobOptions

    const queue = new Queue(queueName, options)
    const worker = new Worker(queueName, workerOrTicker, {
      ...options,
      autorun: false,
    })

    let isRunning = false

    return {
      start: async () => {
        if (isRunning) {
          return
        }

        void worker.run()
        isRunning = true
        console.log(`${queueName}: worker started`)
      },
      schedule: async (pattern: string) => {
        if (isRunning) {
          return
        }

        await queue.upsertJobScheduler(`${queueName}-scheduler`, {
          pattern,
        })
        void worker.run()
        isRunning = true
        console.log(
          `${queueName}: scheduler and worker started with pattern ${pattern}`,
        )
      },
      stop: async () => {
        await worker.close()
        await queue.close()
        console.log(`${queueName}: queue and worker stopped`)
      },
      add: async (name: string, data: InstanceType<T>) => {
        await queue.add(name, data)
      },
      addBulk: async (
        jobs: { name: string; data: InstanceType<T>; opts?: BulkJobOptions }[],
      ) => {
        if (!jobs.length) {
          return
        }
        await queue.addBulk(
          jobs.map((job) => ({
            name: job.name,
            data: job.data,
            opts: job.opts,
          })),
        )
      },
    }
  }
}

/**
 * Creates a cron queue based on BullQueue.
 * Doesn't accept any repeatable payloads yet.
 * You'll need to schedule it nevertheless.
 * @param name
 * @param workerOrTicker
 */
export const createCronQueue = (
  name: string,
  workerOrTicker: WorkerOrTicker<any>,
) => {
  return class extends BullQueue {
    static queueName = name
  }.connect(workerOrTicker)
}
