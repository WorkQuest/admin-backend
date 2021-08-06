import * as Joi from "joi";
import {
  activateAdminAccount, changeLogin,
  changePassword,
  deactivateAdminAccount,
  deleteAdminAccount,
  registerAdminAccount,
  getAdmins,
} from "../../api/v1/settings";
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
  outputPaginationSchema,
} from "@workquest/database-models/lib/schemes";
import {
  Role
} from "@workquest/database-models/lib/models";


const secretSchema = Joi.string().max(255).example('HJRT4QCSGNHGSYLF')

// TODO зачем выностить схему, если она используется только в одном роуте
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


const adminIdParams = Joi.object({
  userId: idSchema.required()
});

export default[{
  method: "GET",
  path: "/v1/settings/adminsList", // TODO v1/admins
  handler: getAdmins,
  options: {
    id: "v1.auth.adminsList",
    tags: ["api", "settings"],
    description: "Get admins list",
    validate: {
      // query: , TODO посмори как это сделано в квестах
    },
    response: {
      // TODO просто admins
      schema: outputPaginationSchema('adminsList', adminSchema). label('GetAdminsListResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/register/sub-admin", // TODO роуты не корректны, v1/admin/create
  handler: registerAdminAccount,
  options: {
    id: "v1.auth.register.subAdmin",
    tags: ["api", "settings"],
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
  path: "/v1/settings/activate/sub-admin/{userId}", // TODO роуты не корректны, v1/admin/{adminId}/activate
  handler: activateAdminAccount,
  options: {
    id: "v1.auth.activate.subAdmin",
    tags: ["api", "settings"],
    description: "Activate sub-admin account",
    validate: {
      params: adminIdParams.label('ActivateAccountParams')
    },
    response: {
      schema: emptyOkSchema.label('ActivateAccountEmptyOutputSchema')
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/deactivate/sub-admin/{userId}", // TODO роуты не корректны, v1/admin/{adminId}/deactivate
  handler: deactivateAdminAccount,
  options: {
    id: "v1.auth.deactivate.subAdmin",
    tags: ["api", "settings"],
    description: "Deactivate sub-admin account",
    validate: {
      params: adminIdParams.label('DeactivateAccountParams')
    },
    response: {
      schema: emptyOkSchema.label('DeactivateAccountEmptyOutputSchema')
    }
  }
}, {
  method: "POST",
  path: "/v1/settings/changeLogin/sub-admin/{userId}", // TODO роуты не корректны, v1/admin/{adminId}/change/login
  handler: changeLogin,
  options: {
    id: "v1.auth.changeLogin",
    tags: ["api", "settings",],
    description: "Change sub-admin login",
    validate: {
      params: adminIdParams.label('DeactivateAccountParams'),
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
  path: "/v1/settings/changePassword/sub-admin/{userId}", // TODO роуты не корректны, v1/admin/{adminId}/change/password
  handler: changePassword,
  options: {
    id: "v1.auth.changePassword",
    tags: ["api", "settings",],
    description: "Change sub-admin password",
    validate: {
      params: adminIdParams.label('DeactivateAccountParams'),
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
    path: "/v1/settings/delete/sub-admin/{userId}", // // TODO роуты не корректны, v1/admin/{adminId}
    handler: deleteAdminAccount,
    options: {
      id: "v1.auth.delete.subAdminAccount",
      tags: ["api", "settings",],
      description: "Delete sub-admin account",
      validate: {
        params: adminIdParams.label('DeleteAccountParams')
      },
      response: {
        schema: emptyOkSchema.label('DeleteAccountEmptyOutputSchema')
      }
    }
  },]
