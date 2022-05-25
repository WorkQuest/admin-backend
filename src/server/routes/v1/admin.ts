import * as Joi from "joi";
import * as handlers from "../../api/v1/admin";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";
import {
  idSchema,
  limitSchema,
  adminSchema,
  offsetSchema,
  emptyOkSchema,
  outputOkSchema,
  adminRoleSchema,
  adminEmailSchema,
  userSessionsSchema,
  adminLastNameSchema,
  adminPasswordSchema,
  adminFirstNameSchema,
  adminWithSecretSchema,
  outputPaginationSchema,
} from "@workquest/database-models/lib/schemes";

export default[{
  method: "GET",
  path: "/v1/admins",
  handler: handlers.getAdmins,
  options: {
    id: "v1.getAdmins",
    tags: ["api", "admin"],
    description: "Get all admins. Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAdminsQuery'),
    },
    response: {
      schema: outputPaginationSchema('admins', adminSchema).label('GetAdminsResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/admin/{adminId}",
  handler: handlers.getAdmin,
  options: {
    id: "v1.getAdmin",
    tags: ["api", "admin"],
    description: "Get admin",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("GetAdminParams"),
    },
    response: {
      schema: outputOkSchema(adminSchema).label('GetAdminResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/admin/{adminId}/sessions",
  handler: handlers.getAdminSessions,
  options: {
    id: "v1.user.getAdminSessions",
    tags: ["api", "admin"],
    description: "Get admin sessions",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required()
      }).label('GetAdminSessionsParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAdminSessionsQuery'),
    },
    response: {
      schema: outputOkSchema(userSessionsSchema).label('GetAdminSessionsResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/admin/sessions",
  handler: handlers.getAdminsSessions,
  options: {
    id: "v1.user.getAdminsSessions",
    tags: ["api", "admin"],
    description: "Get admins sessions",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAdminsSessionsQuery'),
    },
    response: {
      schema: outputOkSchema(userSessionsSchema).label('GetAdminsSessionsResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/admin/create",
  handler: handlers.createAdminAccount,
  options: {
    id: "v1.admin.create",
    tags: ["api", "admin"],
    description: "Create new admin account (not main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      payload: Joi.object({
        firstName: adminFirstNameSchema.required(),
        lastName: adminLastNameSchema.required(),
        email: adminEmailSchema.required(),
        adminRole: adminRoleSchema.required(),
        password: adminPasswordSchema.required(),
      }).label('CreateAdminPayload')
    },
    response: {
      schema: outputOkSchema(adminWithSecretSchema).label("CreateAdminResponse")
    }
  }
}, {
  method: "POST",
  path: "/v1/admin/{adminId}/activate",
  handler: handlers.activateAdminAccount,
  options: {
    id: "v1.admin.activateAdmin",
    tags: ["api", "admin"],
    description: "Activate admin account (forbidden activate main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("ActivateAdminParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/admin/{adminId}/deactivate",
  handler: handlers.deactivateAdminAccount,
  options: {
    id: "v1.admin.deactivateAdmin",
    tags: ["api", "admin"],
    description: "Deactivate admin account (forbidden deactivate main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("DeactivateAdminParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/admin/{adminId}/change/email",
  handler: handlers.changeEmail,
  options: {
    id: "v1.admin.changeEmail",
    tags: ["api", "admin"],
    description: "Change admin login (forbidden to change main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("ChangeEmailParams"),
      payload: Joi.object({
        email: adminEmailSchema.required(),
      }).label('ChangeEmailPayload')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/admin/{adminId}/change/password",
  handler: handlers.changePassword,
  options: {
    id: "v1.admin.changePassword",
    tags: ["api", "admin"],
    description: "Change admin password (forbidden to change main admin). Allow admins: main.",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("ChangePasswordParams"),
      payload: Joi.object({
        newPassword: adminPasswordSchema,
      }).label('ChangePasswordPayload'),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/admin/{adminId}",
  handler: handlers.deleteAdminAccount,
  options: {
    id: "v1.admin.deleteAdmin",
    tags: ["api", "admin"],
    description: "Delete admin account (forbidden delete main admin). Allow admins: main",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("DeleteAdminParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
},]
