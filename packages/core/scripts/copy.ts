import fs from 'node:fs/promises'
import path from 'node:path'

export const copy = async (): Promise<void> => {
  const copyFrom = path.join(__dirname, '../src/pg/migrations')
  const to = path.join(__dirname, '../dist/pg/migrations')

  await fs.cp(copyFrom, to, {
    recursive: true,
  })
}

void copy()
