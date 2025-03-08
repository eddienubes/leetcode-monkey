import { PgService, PostgresDatabase } from '@/pg/PgService'

export class PgDao {
  constructor(protected readonly pgService: PgService) {}

  get client(): PostgresDatabase {
    const tx = this.pgService.getTransaction()
    return tx || this.pgService.getClient()
  }
}
