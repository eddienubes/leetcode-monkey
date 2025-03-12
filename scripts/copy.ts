import fs from 'node:fs/promises'
import path from 'node:path'

export const copy = async (): Promise<void> => {
  const servicePath = path.join(__dirname, '..')

  await fs.cp(
    path.join(servicePath, 'src/pg/migrations'),
    'build/src/pg/migrations',
    { recursive: true },
  )
}

void copy()
