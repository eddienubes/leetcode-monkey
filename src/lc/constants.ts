import { LcProblemDifficulty } from '@/pg/schema'

export const LC_SCORE_COEFFICIENTS: Record<LcProblemDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
}
