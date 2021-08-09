export enum Errors {
  // Invalid payload errors (400)
  InvalidPayload = 400000,
  InvalidAdminType = 400001,
  AlreadyExist = 400002,
  EmailConfirmCodeExpired = 400003,
  InvalidCaptcha = 400004,
  InvalidTOTP = 400005,
  InvalidUserId = 400006,
  InvalidStatus= 400007,
  // Authorization errors (401)
  TokenExpired = 401001,
  TokenInvalid = 401002,
  SessionNotFound = 401003,
  // Not found (404)
  NotFound = 404000,
}
