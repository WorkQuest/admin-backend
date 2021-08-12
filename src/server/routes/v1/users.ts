import * as Joi from "joi";
import {
  blockUser,
  getUserInfo,
  getUsers,
  blackListInfo,
} from "../../api/v1/users";
import {
  emptyOkSchema,
  idSchema,
  outputOkSchema, outputPaginationSchema, paginationFields,
  userSchema,
  usersQuerySchema,
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";

export default[{
  method: "GET",
  path: "/v1/userInfo/{userId}",
  handler: getUserInfo,
  options: {
    id: "v1.userInfo",
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
}, {
  method: "GET",
  path: "/v1/users",
  handler: getUsers,
  options: {
    id: "v1.usersInfo",
    tags: ["api", "users"],
    description: "Get info about users",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: usersQuerySchema.label('QuerySchema')
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label('UsersInfoResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/blackList",
  handler: blackListInfo,
  options: {
    id: "v1.blackList",
    tags: ["api", "users"],
    description: "Show black list",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: usersQuerySchema.label('QuerySchema')
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label('BlackListInfoResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/block/{userId}/user",
  handler: blockUser,
  options: {
    id: "v1.block.user",
    tags: ["api", "users"],
    description: "Block user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserParams"),
    },
    response: {
      schema: emptyOkSchema,
    }
  }
},]

