import * as Joi from "joi";
import * as handlers from "../../api/v1/users";
import { getRbacSettings } from "../../utils/auth";
import { AdminRole, UserRole } from "@workquest/database-models/lib/models";
import {
  emptyOkSchema,
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  outputPaginationSchema,
  payPeriodSchema,
  searchSchema,
  sortDirectionSchema,
  userBlackListReasonSchema,
  userBlackListSchema,
  userRatingStatusesSchema,
  userRoleSchema,
  userSchema,
  userSessionsSchema,
  userStatusesSchema,
  userStatusKycSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/user/{userId}",
  handler: handlers.getUser,
  options: {
    id: "v1.getUser",
    tags: ["api", "user"],
    description: "Get user",
    plugins: getRbacSettings(AdminRole.Main),
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
  handler: handlers.getAllUsers,
  options: {
    id: "v1.getUsers",
    tags: ["api", "user"],
    description: "Get all users",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      query: Joi.object({
        q: searchSchema,
        sort: Joi.object({
          firstName: sortDirectionSchema.default('DESC'),
          lastName: sortDirectionSchema.default('DESC'),
          email: sortDirectionSchema.default('DESC'),
          locationPlaceName: sortDirectionSchema.default('DESC'),
          createdAt: sortDirectionSchema.default('DESC'),
        }).label('SortQuerySchema'),
        statusKYC: userStatusKycSchema,
        role: userRoleSchema,
        smsVerification: Joi.boolean().example(true).label('SmsVerificationSchema'),
        statuses: userStatusesSchema.default(null),
        ratingStatuses: userRatingStatusesSchema,
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
  path: "/v1/employers",
  handler: handlers.getUsers(UserRole.Employer),
  options: {
    id: "v1.getEmployers",
    tags: ["api", "user"],
    description: "Get employers",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      query: Joi.object({
        q: searchSchema,
        sort: Joi.object({
          firstName: sortDirectionSchema.default('DESC'),
          lastName: sortDirectionSchema.default('DESC'),
          email: sortDirectionSchema.default('DESC'),
          locationPlaceName: sortDirectionSchema.default('DESC'),
          createdAt: sortDirectionSchema.default('DESC'),
        }).label('SortQuerySchema'),
        statusKYC: userStatusKycSchema,
        smsVerification: Joi.boolean().example(true).label('SmsVerificationSchema'),
        statuses: userStatusesSchema.default(null),
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetEmployersQuery'),
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label('GetEmployersResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/workers",
  handler: handlers.getUsers(UserRole.Worker),
  options: {
    id: "v1.getWorkers",
    tags: ["api", "user"],
    description: "Get workers",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      query: Joi.object({
        q: searchSchema,
        sort: Joi.object({
          firstName: sortDirectionSchema.default('DESC'),
          lastName: sortDirectionSchema.default('DESC'),
          email: sortDirectionSchema.default('DESC'),
          locationPlaceName: sortDirectionSchema.default('DESC'),
          createdAt: sortDirectionSchema.default('DESC'),
        }).label('SortQuerySchema'),
        statusKYC: userStatusKycSchema,
        smsVerification: Joi.boolean().example(true).label('SmsVerificationSchema'),
        payPeriod: payPeriodSchema,
        statuses: userStatusesSchema.default(null),
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetWorkersQuery'),
    },
    response: {
      schema: outputPaginationSchema('users', userSchema).label('GetWorkersResponse')
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
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      params: Joi.object({
        userId: idSchema.required()
      }).label('GetUserBlockingHistoryParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUserBlockingHistoryQuery'),
    },
    response: {
      schema: outputPaginationSchema('BlackLists', userBlackListSchema).label('GetUserBlockingHistoryResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/sessions",
  handler: handlers.getUserSessions,
  options: {
    id: "v1.user.getUserSessions",
    tags: ["api", "user"],
    description: "Get user sessions",
    plugins: getRbacSettings(AdminRole.Main),
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
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      query: Joi.object({
        q: searchSchema,
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
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("ChangeUserRoleParams"),
    },
    response: {
      schema: emptyOkSchema
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
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("BlockUserParams"),
      payload: Joi.object({
        blockReason: userBlackListReasonSchema.required(),
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
    plugins: getRbacSettings(AdminRole.Main),
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

