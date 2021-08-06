import * as Joi from "joi";
import {
  activateAdminAccount, changeLogin,
  changePassword,
  deactivateAdminAccount,
  deleteAdminAccount,
  registerAdminAccount,
  getAdminsList,
} from "../../api/v1/settings";
import {
  Role
} from "@workquest/database-models/lib/models"

import {
  adminRoleSchema,
  adminEmailSchema,
  adminFirstNameSchema,
  adminLastNameSchema,
  adminPasswordSchema,
  idSchema,
  outputOkSchema,
  totpSchema,
  emptyOkSchema,
  paginationFields, outputPaginationSchema,
} from "@workquest/database-models/lib/schemes";
import {logout} from "../../api/v1/auth";


const secretSchema = Joi.string().max(255).example('HJRT4QCSGNHGSYLF')

const registerAdminSchema = Joi.object({
  firstName: adminFirstNameSchema.required(),
  lastName: adminLastNameSchema.required(),
  email: adminEmailSchema.required(),
  adminRole: adminRoleSchema.required(),
  password: adminPasswordSchema.required(),
}).label("RegisterAdminSchema")

const adminSchema = Joi.object({
  id: idSchema,
  firstName: adminFirstNameSchema.required(),
  lastName: adminLastNameSchema.required(),
  email: adminEmailSchema.required(),
  adminRole: adminRoleSchema.required(),
}).label('AdminSchema')

const registerAdminWithSecretSchema = Joi.object({
  data: { adminSchema },
  secret: secretSchema.required(),
}).label('RegisterAdminWithSecretSchema')


const accountIdParams = Joi.object({
  userId: idSchema.required()
})

export default[{
  method: "GET",
  path: "/v1/settings/adminsList",
  handler: getAdminsList(Role.main),
  options: {
    id: "v1.auth.adminsList",
    tags: ["api", "settings"],
    description: "Get admins list",
    validate: {
      query: Joi.object({
        ...paginationFields
      }).label('GetAdminListQuery'),
    },
    response: {
      schema: outputPaginationSchema('adminsList', adminSchema). label('GetAdminsListResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/register/sub-admin",
  handler: registerAdminAccount(Role.main),
  options: {
    id: "v1.auth.register.subAdmin",
    tags: ["api", "settings",],
    description: "Register new sub-admin account",
    validate: {
      payload: registerAdminSchema.label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(registerAdminWithSecretSchema).label("RegisterThenGetSecretResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/activate/sub-admin/{userId}",
  handler: activateAdminAccount(Role.main),
  options: {
    id: "v1.auth.activate.subAdmin",
    tags: ["api", "settings",],
    description: "Activate sub-admin account",
    validate: {
      params: accountIdParams.label('ActivateAccountParams')
    },
    response: {
      schema: emptyOkSchema.label('ActivateAccountEmptyOutputSchema')
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/deactivate/sub-admin/{userId}",
  handler: deactivateAdminAccount(Role.main),
  options: {
    id: "v1.auth.deactivate.subAdmin",
    tags: ["api", "settings",],
    description: "Deactivate sub-admin account",
    validate: {
      params: accountIdParams.label('DeactivateAccountParams')
    },
    response: {
      schema: emptyOkSchema.label('DeactivateAccountEmptyOutputSchema')
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/changeLogin/sub-admin/{userId}",
  handler: changeLogin(Role.main),
  options: {
    id: "v1.auth.changeLogin",
    tags: ["api", "settings",],
    description: "Change sub-admin login",
    validate: {
      params: accountIdParams.label('DeactivateAccountParams'),
      payload: Joi.object({
        newLogin: adminEmailSchema,
        totp: totpSchema,
      })
    },
    response: {
      schema: emptyOkSchema.label('DeactivateAccountEmptyOutputSchema')
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/changePassword/sub-admin/{userId}",
  handler: changePassword(Role.main),
  options: {
    id: "v1.auth.changePassword",
    tags: ["api", "settings",],
    description: "Change sub-admin password",
    validate: {
      params: accountIdParams.label('DeactivateAccountParams'),
      payload: Joi.object({
        newPassword: adminPasswordSchema,
        totp: totpSchema,
      })
    },
    response: {
      schema: emptyOkSchema.label('DeactivateAccountEmptyOutputSchema')
    }
  }
}, {
    method: "DELETE",
    path: "/v1/settings/delete/sub-admin/{userId}",
    handler: deleteAdminAccount(Role.main),
    options: {
      id: "v1.auth.delete.subAdminAccount",
      tags: ["api", "settings",],
      description: "Delete sub-admin account",
      validate: {
        params: accountIdParams.label('DeleteAccountParams')
      },
      response: {
        schema: emptyOkSchema.label('DeleteAccountEmptyOutputSchema')
      }
    }
  },]
