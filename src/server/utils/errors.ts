export enum Errors {
  // Invalid payload errors (400)
  InvalidPayload = 400000,
  // Authorization errors (401)
  TokenExpired = 401001,
  TokenInvalid = 401002,
  SessionNotFound = 401003,
  // Not found (404)
  NotFound = 404000,
}
