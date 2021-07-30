import * as Joi from "joi";
import { login, registerAccount } from "../../api/v1/auth";
import { Role } from "../../models/Admin";
import { adminRoleSchema, } from "../../schemes/admin";
import { emailSchema, firstNameSchema, lastNameSchema, passwordSchema, jwtToken, } from "../../schemes/common";
import { emptyOutputSchema, outputOkSchema } from "../../schemes";

export const registerAdminSchema = Joi.object({
  firstName: firstNameSchema.required(),
  lastName: lastNameSchema.required(),
  email: emailSchema.required(),
  adminRole: adminRoleSchema.required(),
  password: passwordSchema.required(),
}).label("RegisterAdminSchema")

const tokens = Joi.object({
  access: jwtToken,
  refresh: jwtToken,
}).label("Tokens");

const captchaTokenSchema = Joi.string().example('recaptcha token');
const tokensWithStatusResponse = outputOkSchema(tokens).label("TokensResponse");

export default[{
  method: "POST",
  path: "/v1/auth/register/sub-admin",
  handler: registerAccount,
  options: {
    auth: false,
    id: "v1.auth.register.subAdmin",
    tags: ["api", "auth",],
    description: "Register new sub-admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(tokens).label("TokensResponse")
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
        email: emailSchema.required(),
        password: passwordSchema.required(),
      }).label("AuthLoginPayload")
    },
    response: {
      schema: tokensWithStatusResponse
    }
  }
},]