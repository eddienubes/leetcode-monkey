export type ServerActionSuccess<T> = {
  data: T
  status: 'success'
}
export type ServerActionError = {
  error: string
  status: 'error'
}
export type ServerActionResponse<T> = ServerActionSuccess<T> | ServerActionError

export const action =
  <T, A extends any[]>(cb: (...args: A) => Promise<T>) =>
  async (...args: A): Promise<ServerActionResponse<T>> => {
    try {
      const res = await cb(...args)
      return {
        data: res,
        status: 'success',
      }
    } catch (e) {
      console.error(e)
      return {
        error: 'Something went wrong',
        status: 'error',
      }
    }
  }
