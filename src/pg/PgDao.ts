import { PgService, PostgresDatabase } from '@/pg/PgService'

export class PgDao {
  protected readonly pgService: PgService
  constructor(pgService: PgService) {
    this.pgService = pgService
  }

  get client(): PostgresDatabase {
    const tx = this.pgService.getTransaction()
    return tx || this.pgService.getClient()
  }
}
