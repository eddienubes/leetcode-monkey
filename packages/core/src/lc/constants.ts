import { LcProblemDifficulty } from '../pg/schema'

export const LC_SCORE_COEFFICIENTS: Record<LcProblemDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
}

export const LC_DIFFEMOJI: Record<
  LcProblemDifficulty | 'Easy' | 'Medium' | 'Hard',
  string
> = {
  easy: '🟢',
  Easy: '🟢',
  medium: '🟡',
  Medium: '🟡',
  hard: '🔴',
  Hard: '🔴',
}
