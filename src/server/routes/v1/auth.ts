import * as Joi from "joi";
import { login } from "../../api/v1/auth";
import { adminRoleSchema, } from "database-models/lib/schemes/admin";
import { emailSchema, firstNameSchema, lastNameSchema, passwordSchema, jwtToken, } from "database-models/lib/schemes/common";
import { jwtTokens, outputOkSchema, jwtTokenAccess, jwtTokenRefresh  } from "database-models/lib/schemes";

export const secretSchema = Joi.string().max(255).example('HJRT4QCSGNHGSYLF')

export const registerAdminSchema = Joi.object({
  firstName: firstNameSchema.required(),
  lastName: lastNameSchema.required(),
  email: emailSchema.required(),
  adminRole: adminRoleSchema.required(),
  password: passwordSchema.required(),
}).label("RegisterAdminSchema")

// export const userWithSecretSchema = Joi.object({
//   firstName: firstNameSchema.required(),
//   lastName: lastNameSchema.required(),
//   email: emailSchema.required(),
//   adminRole: adminRoleSchema.required(),
//   secret: secretSchema.required(),
// })

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
        email: emailSchema.required(),
        password: passwordSchema.required(),
        totp: totpSchema,
      }).label("AuthLoginPayload")
    },
    response: {
      schema: outputOkSchema(jwtTokens).label("TokensResponse")
    }
  }
 },]
