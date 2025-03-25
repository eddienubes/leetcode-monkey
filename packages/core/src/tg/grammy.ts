export type GrammyDynamicApi = Awaited<ReturnType<typeof getGrammy>>

export const getGrammy = async () => {
  const parseMode = await import('@grammyjs/parse-mode')

  return {
    parseMode,
  }
}
