export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  NotFound: (resource: string) => new AppError(404, `${resource}을(를) 찾을 수 없습니다`),
  Unauthorized: () => new AppError(401, '인증이 필요합니다'),
  Forbidden: () => new AppError(403, '권한이 없습니다'),
  BadRequest: (msg: string) => new AppError(400, msg),
  Conflict: (msg: string) => new AppError(409, msg),
};
