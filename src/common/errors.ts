export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = NotFoundError.name
  }
}

export class BaseTgError extends Error {
  constructor(message?: string, cause?: unknown) {
    super(message)
    this.name = BaseTgError.name
    this.cause = cause
  }
}

export class TgCannotDeleteMessageError extends BaseTgError {
  constructor(message?: string, cause?: unknown) {
    super(message, cause)
    this.name = TgCannotDeleteMessageError.name
  }
}
