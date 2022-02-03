import * as Joi from "joi";
import * as handlers from "../../api/v1/users";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";
import {
  idSchema,
  userSchema,
  phoneSchema,
  limitSchema,
  offsetSchema,
  emptyOkSchema,
  outputOkSchema,
  userRoleSchema,
  userSessionsSchema,
  outputPaginationSchema,
} from "@workquest/database-models/lib/schemes";

export default[{
  method: "GET",
  path: "/v1/user/{userId}",
  handler: handlers.getUser,
  options: {
    id: "v1.getUser",
    tags: ["api", "user"],
    description: "Get user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserParams"),
    },
    response: {
      schema: outputOkSchema(userSchema).label('GetUserResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/users",
  handler: handlers.getUsers,
  options: {
    id: "v1.getUsers",
    tags: ["api", "user"],
    description: "Get all users",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUsersQuery'),
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label('GetUsersResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/block-history",
  handler: handlers.getUserBlockingHistory,
  options: {
    id: "v1.user.getBlockHistory",
    tags: ["api", "user"],
    description: "Show user block story",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required()
      }).label('GetUserBlockingHistoryParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUserBlockingHistoryQuery'),
    },
    // response: {
    //   schema: outputPaginationSchema('blockReasons', userBlockReasonSchema).label('GetUserBlockingHistoryResponse')
    // }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/sessions",
  handler: handlers.getUserSessions,
  options: {
    id: "v1.user.getUserSessions",
    tags: ["api", "user"],
    description: "Get user sessions",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required()
      }).label('GetUserSessionsParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUserSessionsQuery'),
    },
    response: {
      schema: outputOkSchema(userSessionsSchema).label('GetUserSessionsResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/sessions",
  handler: handlers.getUsersSessions,
  options: {
    id: "v1.user.getUsersSessions",
    tags: ["api", "user"],
    description: "Get users sessions",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUsersSessionsQuery'),
    },
    response: {
      schema: outputOkSchema(userSessionsSchema).label('GetUsersSessionsResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/user/{userId}/change-role",
  handler: handlers.changeUserRole,
  options: {
    id: "v1.user.changeRole",
    tags: ["api", "user"],
    description: "Change role of the user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("ChangeUserRoleParams"),
      payload: Joi.object({
        role: userRoleSchema,
      }).label('ChangeUserRolePayload')
    },
    response: {
      schema: outputOkSchema(userSchema).label('ChangeUserRoleResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/user/{userId}/phone/change",
  handler: handlers.changePhone,
  options: {
    id: "v1.user.changePhone",
    tags: ["api", "user"],
    description: "Change phone on user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("ChangeUserPhoneParams"),
      payload: Joi.object({
        newPhone: phoneSchema.required(),
      }).label('ChangeUserPhonePayload'),
    },
    response: {
      schema: emptyOkSchema,
    }
  }
}, {
  method: "POST",
  path: "/v1/user/{userId}/block",
  handler: handlers.blockUser,
  options: {
    id: "v1.blockUser",
    tags: ["api", "user"],
    description: "Block user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("BlockUserParams"),
      payload: Joi.object({
        // blockReasons: blockReasonSchema,
      }).label('BlockUserPayload')
    },
    response: {
      schema: emptyOkSchema,
    }
  }
}, {
  method: "PUT",
  path: "/v1/user/{userId}/unblock",
  handler: handlers.unblockUser,
  options: {
    id: "v1.unblockUser",
    tags: ["api", "user"],
    description: "Unblock user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("UnblockUserParams"),
    },
    response: {
      schema: emptyOkSchema,
    }
  }
}]

