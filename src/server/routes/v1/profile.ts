import * as Joi from "joi";
import * as handlers from "../../api/v1/profile";
import {
  adminSchema,
  outputOkSchema,
  adminLastNameSchema,
  adminFirstNameSchema,
} from "@workquest/database-models/lib/schemes";

export default[{
  method: "GET",
  path: "/v1/profile/me",
  handler: handlers.getMe,
  options: {
    id: "v1.admin.getMe",
    tags: ["api", "profile"],
    description: "Get my profile",
    response: {
      schema: outputOkSchema(adminSchema).label('GetMeResponse')
    }
  }
}, {
  method: "PUT",
  path: "/v1/profile/edit",
  handler: handlers.editProfile,
  options: {
    id: "v1.admin.editProfile",
    tags: ["api", "profile"],
    description: "Edit admin profile",
    validate: {
      payload: Joi.object({
        firstName: adminFirstNameSchema,
        lastName: adminLastNameSchema,
        // age: adminAgeSchema,
        // about: adminAboutSchema,
        // languages: adminLanguagesSchema,
      }).label('EditAdminPayload')
    },
    response: {
      schema: outputOkSchema(adminSchema).label("EditAdminResponse")
    }
  }
}]
