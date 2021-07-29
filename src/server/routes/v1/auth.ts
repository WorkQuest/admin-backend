import * as Joi from "joi";
import { registerAccount } from "../../api/v1/auth";
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

export default[{
  method: "POST",
  path: "v1/register/main-admin",
  handler: registerAccount(AdminRole.MAIN_ADMIN),
  options: {
    auth: false,
    id: "v1.auth.register.mainAdmin",
    tags: ["api", "auth", "register"],
    description: "Register new main admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: emptyOutputSchema//outputOkSchema(tokensWithStatus).label("TokensWithStatusResponse")
    }
  }
}]