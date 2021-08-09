import * as Joi from "joi";
import {getRbacSettings} from "../../utils/auth";
import {
  activateAdminAccount, changeLogin,
  changePassword,
  deactivateAdminAccount,
  deleteAdminAccount,
  registerAdminAccount,
  getAdmins,
} from "../../api/v1/admin";
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
  adminQuerySchema,
} from "@workquest/database-models/lib/schemes";
import {AdminRole} from "@workquest/database-models/lib/models";

const secretSchema = Joi.string().max(255).example('HJRT4QCSGNHGSYLF')

const adminSchema = Joi.object({
  id: idSchema,
  firstName: adminFirstNameSchema.required(),
  lastName: adminLastNameSchema.required(),
  email: adminEmailSchema.required(),
  role: adminRoleSchema.required(),
}).label('AdminSchema')

const registerAdminWithSecretSchema = Joi.object({
  data: { adminSchema },
  secret: secretSchema.required(),
}).label('RegisterAdminWithSecretSchema')


const adminIdParams = Joi.object({
  adminId: idSchema.required()
});

export default[{
  method: "GET",
  path: "v1/admins",
  handler: getAdmins,
  options: {
    id: "v1.auth.adminsList",
    tags: ["api", "settings"],
    description: "Get admins list. Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: adminQuerySchema,
    },
    response: {
      schema: outputPaginationSchema('admins', adminSchema).label('GetAdminsListResponse')
    }
  }
}, {
  method: "POST",
  path: "v1/admin/create",
  handler: registerAdminAccount,
  options: {
    id: "v1.admin.registerAdmin",
    tags: ["api", "admin"],
    description: "Register new admin account (not main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      payload: Joi.object({
        firstName: adminFirstNameSchema.required(),
        lastName: adminLastNameSchema.required(),
        email: adminEmailSchema.required(),
        adminRole: adminRoleSchema.required(),
        password: adminPasswordSchema.required(),
      }).label('RegisterAdminPayload')
    },
    response: {
      schema: outputOkSchema(registerAdminWithSecretSchema).label("RegisterThenGetSecretResponse")
    }
  }
}, {
  method: "POST",
  path: "v1/admin/{adminId}/activate",
  handler: activateAdminAccount,
  options: {
    id: "v1.auth.activateAdmin",
    tags: ["api", "admin"],
    description: "Activate admin account (forbidden activate main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: adminIdParams.label('ActivateAccountParams')
    },
    response: {
      schema: emptyOkSchema.label('ActivateAccountEmptyOutputSchema')
    }
  }
}, {
  method: "POST",
  path: "v1/admin/{adminId}/deactivate",
  handler: deactivateAdminAccount,
  options: {
    id: "v1.admin.deactivateAdmin",
    tags: ["api", "admin"],
    description: "Deactivate admin account (forbidden deactivate main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: adminIdParams.label('DeactivateAccountParams')
    },
    response: {
      schema: emptyOkSchema.label('DeactivateAccountEmptyOutputSchema')
    }
  }
}, {
  method: "POST",
  path: "v1/admin/{adminId}/change/login",
  handler: changeLogin,
  options: {
    id: "v1.admin.change.login",
    tags: ["api", "admin"],
    description: "Change admin login (forbidden to change main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
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
  path: "v1/admin/{adminId}/change/password",
  handler: changePassword,
  options: {
    id: "v1.admin.change.password",
    tags: ["api", "admin"],
    description: "Change admin password (forbidden to change main admin). Allow admins: main.",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: adminIdParams.label('DeactivateAccountParams'),
      payload: Joi.object({
        newPassword: adminPasswordSchema,
        totp: totpSchema,
      })
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "v1/admin/{adminId}",
  handler: deleteAdminAccount,
  options: {
    id: "v1.admin.deleteAdmin",
    tags: ["api", "admin"],
    description: "Delete admin account (forbidden delete main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: adminIdParams.label('DeleteAccountParams')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}]
