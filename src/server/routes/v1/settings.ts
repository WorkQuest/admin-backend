import * as Joi from "joi";
import { deleteAdminAccount, registerAdminAccount } from "../../api/v1/settings";
import { adminRoleSchema, } from "database-models/lib/schemes/admin";
import { emailSchema, firstNameSchema, lastNameSchema, passwordSchema, jwtToken, idSchema, } from "database-models/lib/schemes/common";
import { outputOkSchema, jwtTokenAccess, jwtTokenRefresh, emptyOutputSchema  } from "database-models/lib/schemes";

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

export const accountIdParams = Joi.object({
    userId: idSchema.required()
})

export default[{
  method: "POST",
  path: "/v1/settings/register/sub-admin",
  handler: registerAdminAccount,
  options: {
    id: "v1.auth.register.subAdmin",
    tags: ["api", "settings",],
    description: "Register new sub-admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(secretSchema).label("RegisterThenGetSecretResponse")
    }
  }
}, {
    method: "DELETE",
    path: "/v1/settings/delete/sub-admin/{userId}",
    handler: deleteAdminAccount,
    options: {
      id: "v1.auth.delete.subAdminAccount",
      tags: ["api", "settings",],
      description: "Delete sub-admin account",
      validate: {
        params: accountIdParams.label('DeleteAccountParams')
      },
      response: {
        schema: emptyOutputSchema.label('DeleteAccountEmptyOutputSchema')
      }
    }
  },]
