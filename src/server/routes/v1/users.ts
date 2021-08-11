import * as Joi from "joi";
import {
  getUserInfo,
} from "../../api/v1/users";
import {
  idSchema,
  outputOkSchema,
  userSchema,
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";

export default[{
  method: "GET",
  path: "/v1/quest/userInfo/{userId}",
  handler: getUserInfo,
  options: {
    id: "v1.disputes.userInfo",
    tags: ["api", "users"],
    description: "Get info about user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserParams"),
    },
    response: {
      schema: outputOkSchema(userSchema).label('UserInfoResponse')
    }
  }
}]

