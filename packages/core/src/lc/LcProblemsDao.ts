import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { PgDao, PgService } from '../pg'
import { lcProblems } from '../pg/schema'
import { Injectable } from '@/common'

export type LcProblemSelect = InferSelectModel<typeof lcProblems>
export type LcProblemInsert = InferInsertModel<typeof lcProblems>

@Injectable(PgService)
export class LcProblemsDao extends PgDao {
  constructor(pgService: PgService) {
    super(pgService)
  }

  async create(user: LcProblemInsert): Promise<LcProblemSelect> {
    const [created] = await this.client
      .insert(lcProblems)
      .values(user)
      .returning()
    return created
  }

  async update(user: LcProblemInsert): Promise<LcProblemSelect> {
    const [updated] = await this.client.update(lcProblems).set(user).returning()
    return updated
  }

  async upsert(p: LcProblemInsert): Promise<LcProblemSelect> {
    const [upserted] = await this.client
      .insert(lcProblems)
      .values(p)
      .onConflictDoUpdate({
        target: [lcProblems.slug],
        set: p,
      })
      .returning()
    return upserted
  }

  async getBySlug(slug: string): Promise<LcProblemSelect | null> {
    const hit = await this.client.query.lcProblems.findFirst({
      where: eq(lcProblems.slug, slug),
    })
    return hit || null
  }
}
