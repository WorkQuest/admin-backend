import * as Joi from "joi";
import {
  blockUser,
  getUserInfo,
  getUsers,
  blackListInfo,
  unblockUser,
  changeUserRole
} from "../../api/v1/users";
import {
  emptyOkSchema,
  idSchema,
  outputOkSchema,
  outputPaginationSchema,
  userRoleSchema,
  userSchema,
  usersQuerySchema,
  userFullSchema,
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";

const userBlockedReasonsSchema = Joi.string().example('You are blocked...').label('UserBlockReasons');

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
      schema: outputOkSchema(userFullSchema).label('UserInfoResponse')
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
      schema: outputPaginationSchema('users', userFullSchema).label('UsersInfoResponse')
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
      schema: outputPaginationSchema('users', userFullSchema).label('BlackListInfoResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/change-role/{userId}",
  handler: changeUserRole,
  options: {
    id: "v1.user.change.role",
    tags: ["api", "users"],
    description: "Change role of the user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("UserParams"),
      payload: Joi.object({
        role: userRoleSchema,
      }).label('ChangeUserRoleSchema')
    },
    response: {
      schema: outputOkSchema(userFullSchema).label('QuestInfoResponse')
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
      }).label("UserParams"),
      payload: Joi.object({
        userBlockReasons: userBlockedReasonsSchema,
      })
    },
    response: {
      schema: emptyOkSchema,
    }
  }
}, {
  method: "POST",
  path: "/v1/unblock/{userId}/user",
  handler: unblockUser,
  options: {
    id: "v1.unblock.user",
    tags: ["api", "users"],
    description: "Unblock user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("UserParams"),
    },
    response: {
      schema: emptyOkSchema,
    }
  }
},]

