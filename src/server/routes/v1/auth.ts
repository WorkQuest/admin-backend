import * as Joi from "joi";
import { login, logout } from "../../api/v1/auth";
import {
  adminRoleSchema,
  adminEmailSchema,
  adminFirstNameSchema,
  adminLastNameSchema,
  adminPasswordSchema,
  jwtTokens,
  outputOkSchema,
  jwtTokenAccess,
  jwtTokenRefresh, emptyOkSchema
} from "@workquest/database-models/lib/schemes";

export const secretSchema = Joi.string().max(255).example('HJRT4QCSGNHGSYLF')

export const jwtWithSecretSchema = Joi.object({
  access: jwtTokenAccess,
  refresh: jwtTokenRefresh,
  secret: secretSchema,
}).label('JwtWithSecretSchema')

export const totpSchema = Joi.string().max(255).example('772670')

export default[{
  method: "GET",
  path: "/v1/auth/logout",
  handler: logout,
  options: {
    id: "v1.auth.logout",
    tags: ["api", "auth"],
    description: "Logout from account",
    response: {
      schema: emptyOkSchema.label("LogoutResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/login",
  handler: login,
  options: {
    auth: false,
    id: "v1.auth.login",
    tags: ["api", "auth"],
    description: "Login into account",
    validate: {
      payload: Joi.object({
        email: adminEmailSchema.required(),
        password: adminPasswordSchema.required(),
        totp: totpSchema,
      }).label("AuthLoginPayload")
    },
    response: {
      schema: outputOkSchema(jwtTokens).label("TokensResponse")
    }
  }
 },]
