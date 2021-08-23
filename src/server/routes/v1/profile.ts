import * as Joi from "joi";
import {getMe, editProfile, adminResolvedDisputes} from "../../api/v1/profile";
import {
  adminAgeSchema,
  adminFirstNameSchema,
  adminLastNameSchema,
  adminEmailSchema,
  adminSchema,
  outputOkSchema,
  adminAboutSchema, adminLanguagesSchema, disputesQuerySchema, outputPaginationSchema, disputeSchema, idSchema
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";

export default[{
  method: "GET",
  path: "/v1/profile/me",
  handler: getMe,
  options: {
    id: "v1.admin.get.ownProfile",
    tags: ["api", "profile"],
    description: "Get admin own profile",
    response: {
      schema: outputOkSchema(adminSchema).label('GetAdminProfileResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/admin/{adminId}/completed-disputes",
  handler: adminResolvedDisputes,
  options: {
    id: "v1.admin.completed.disputes",
    tags: ["api", "profile"],
    description: "Get info about completed disputes of admin",
    plugins: getRbacSettings(AdminRole.dispute),
    validate: {
      query: disputesQuerySchema.label('QuerySchema'),
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputesInfoResponse')
    }
  }
}, {
  method: "PUT",
  path: "/v1/admin/edit",
  handler: editProfile,
  options: {
    id: "v1.admin.edit.ownProfile",
    tags: ["api", "profile"],
    description: "Edit admin own profile",
    validate: {
      payload: Joi.object({
        firstName: adminFirstNameSchema,
        lastName: adminLastNameSchema,
        email: adminEmailSchema,
        age: adminAgeSchema,
        about: adminAboutSchema,
        languages: adminLanguagesSchema,
      }).label('EditAdminPayload')
    },
    response: {
      schema: outputOkSchema(adminSchema).label("EditAdminResponse")
    }
  }
},]
