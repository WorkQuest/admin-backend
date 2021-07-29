import * as Joi from "joi";
import { confirmEmail, login, registerAccount } from "../../api/v1/auth";
import { AdminRole } from "../../models/Admin";
import { adminRoleSchema, adminStatusSchema } from "../../schemes/admin";
import { emailSchema, firstNameSchema, lastNameSchema, passwordSchema, jwtToken, } from "../../schemes/common";
import { emptyOutputSchema, outputOkSchema } from "../../schemes";

export const registerAdminSchema = Joi.object({
  firstName: firstNameSchema.required(),
  lastName: lastNameSchema.required(),
  email: emailSchema.required(),
  adminRole: adminRoleSchema.required(),
  password: passwordSchema.required(),
}).label("RegisterAdminSchema")

const tokensWithStatus = Joi.object({
  access: jwtToken,
  refresh: jwtToken,
  userStatus: adminStatusSchema,
}).label("TokensWithStatus");

const confirmCodeSchema = Joi.string().regex(/[0-9a-fA-F]{6}/).lowercase().example("123da4");
const captchaTokenSchema = Joi.string().example('recaptcha token');
const tokensWithStatusResponse = outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse");

export default[{
  method: "POST",
  path: "/v1/auth/register/main-admin",
  handler: registerAccount(AdminRole.MAIN_ADMIN),
  options: {
    auth: false,
    id: "v1.auth.register.mainAdmin",
    tags: ["api", "auth",],
    description: "Register new main admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/register/disput-admin",
  handler: registerAccount(AdminRole.DISPUT_ADMIN),
  options: {
    auth: false,
    id: "v1.auth.register.disputAdmin",
    tags: ["api", "auth",],
    description: "Register new disput admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/register/advertising-admin",
  handler: registerAccount(AdminRole.ADVERTISING_ADMIN),
  options: {
    auth: false,
    id: "v1.auth.register.advertisingAdmin",
    tags: ["api", "auth",],
    description: "Register new advertising admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/register/kyc-admin",
  handler: registerAccount(AdminRole.KYC_ADMIN),
  options: {
    auth: false,
    id: "v1.auth.register.kycAdmin",
    tags: ["api", "auth",],
    description: "Register new kyc admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
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
        recaptcha: captchaTokenSchema.required(),
      }).label("AuthLoginPayload")
    },
    response: {
      schema: tokensWithStatusResponse
    }
  }
}, {
  method: "POST",
  path: "/v1/auth/confirm-email",
  handler: confirmEmail,
  options: {
    id: "v1.auth.confirmEmail",
    tags: ["api", "auth",],
    description: "Confirm email",
    validate: {
      payload: Joi.object({
        confirmCode: confirmCodeSchema.required()
      }).label("ConfirmEmailPayload")
    },
    response: {
      schema: emptyOutputSchema.label("ConfirmEmailEmptyResponce")
    }
  }
},]