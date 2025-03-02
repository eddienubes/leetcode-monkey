import { PgService } from '@/pg/PgService'

export const clearDb = async (): Promise<void> => {
  const pgService = new PgService()
  await pgService.dropSchema()
  process.exit(0)
}

void clearDb()
