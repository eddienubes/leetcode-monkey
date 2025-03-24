export const register = async () => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { container } = await import('@/server/container')
    await container.start()
  }
}
