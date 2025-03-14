import { PgDao } from '@/pg/PgDao'
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { PgService } from '@/pg/PgService'
import { lcProblems } from '@/pg/schema'

export type LcProblemSelect = InferSelectModel<typeof lcProblems>
export type LcProblemInsert = InferInsertModel<typeof lcProblems>

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
