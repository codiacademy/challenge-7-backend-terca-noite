export class AppError extends Error {
  public statusCode: 400 | 401 | 403 | 404 | 409 | 500;

  constructor(message: string, statusCode: 400 | 401 | 403 | 404 | 409 | 500 = 400) {
    super(message);
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
