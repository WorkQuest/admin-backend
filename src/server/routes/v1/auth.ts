import * as Joi from "joi";
import { login } from "../../api/v1/auth";
import { adminRoleSchema,
  adminEmailSchema,
  adminFirstNameSchema,
  adminLastNameSchema,
  adminPasswordSchema,
  jwtTokens,
  outputOkSchema,
  jwtTokenAccess,
  jwtTokenRefresh
} from "@workquest/database-models/lib/schemes";

export const secretSchema = Joi.string().max(255).example('HJRT4QCSGNHGSYLF')

export const registerAdminSchema = Joi.object({
  firstName: adminFirstNameSchema.required(),
  lastName: adminLastNameSchema.required(),
  email: adminEmailSchema.required(),
  adminRole: adminRoleSchema.required(),
  password: adminPasswordSchema.required(),
}).label("RegisterAdminSchema")

export const jwtWithSecretSchema = Joi.object({
  access: jwtTokenAccess,
  refresh: jwtTokenRefresh,
  secret: secretSchema,
}).label('JwtWithSecretSchema')

export const totpSchema = Joi.string().max(255).example('772670')

export default[{
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
