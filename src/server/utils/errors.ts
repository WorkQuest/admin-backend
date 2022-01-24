export enum Errors {
  // Invalid payload errors (400)
  InvalidPayload = 400000,
  UnconfirmedUser = 400001,
  InvalidRole = 400002,
  InvalidStatus = 400003,
  AlreadyAnswer = 400004,
  KYCAlreadyVerified = 400005,
  KYCRequired = 400006,
  InvalidEmail = 400005,
  InvalidActiveStatusTOTP = 400006,
  InvalidTOTP = 400007,
  UserAlreadyConfirmed = 400008,
  InvalidType = 400009,
  AlreadyExists = 400010,
  WalletExists = 400011,
  // Authorization errors (401)
  TokenExpired = 401001,
  TokenInvalid = 401002,
  SessionNotFound = 401003,
  // Forbidden (403)
  Forbidden = 403000,
  // Not found (404)
  NotFound = 404000,
  // Conflict (409)
  SumSubError = 409001,
  LiquidityError = 409002,
}
