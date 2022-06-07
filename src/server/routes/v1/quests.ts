import * as Joi from "joi";
import * as handlers from "../../api/v1/quests";
import { getRbacSettings } from "../../utils/auth";
import { AdminRole } from "@workquest/database-models/lib/models";
import {
  createdBetweenSchema,
  emptyOkSchema,
  idSchema,
  idsSchema,
  limitSchema,
  locationFullSchema,
  offsetSchema,
  outputOkSchema,
  outputPaginationSchema,
  payPeriodSchema,
  prioritiesSchema,
  prioritySchema,
  questBlackListReasonSchema,
  questBlackListSchema,
  questEmploymentSchema,
  questForAdminsGetSchema,
  questSchema,
  questStatusesSchema,
  searchSchema, sortDirectionSchema,
  specializationKeysSchema,
  workPlaceSchema,
  updatedBetweenSchema,
} from "@workquest/database-models/lib/schemes";

export default[{
  method: "GET",
  path: "/v1/quests",
  handler: handlers.getQuests,
  options: {
    id: "v1.getQuests",
    tags: ["api", "quest"],
    description: "Get quests",
    validate: {
      query: Joi.object({
        q: searchSchema,
        statuses: questStatusesSchema,
        priorities: prioritiesSchema,
        createdBetween: createdBetweenSchema,
        updatedBetween: updatedBetweenSchema,
        sort: Joi.object({
          dispute: sortDirectionSchema.default('DESC')
        }).label('GetUsersQuestsSort'),
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestsQuery'),
    },
    response: {
      schema: outputPaginationSchema('quests', questForAdminsGetSchema).label('GetQuestsResponse')
    },
  }
}, {
  method: "GET",
  path: "/v1/quest/{questId}",
  handler: handlers.getQuest,
  options: {
    id: "v1.quest.info",
    tags: ["api", "quest"],
    description: "Get info about quest",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Support),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("GetQuestParams"),
    },
    response: {
      schema: outputOkSchema(questForAdminsGetSchema).label('GetQuestResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/quests",
  handler: handlers.getQuests,
  options: {
    id: "v1.user.getQuests",
    tags: ["api", "quest"],
    description: "Get info about quests of the user",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Support),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUsersQuestsParams"),
      query: Joi.object({
        statuses: questStatusesSchema,
        priorities: prioritiesSchema,
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUsersQuestsQuery'),
    },
    response: {
      schema: outputPaginationSchema('quests', questForAdminsGetSchema).label('GetUsersQuestsResponse')
    }
  }
}, {
  method: "PUT",
  path: "/v1/quest/{questId}",
  handler: handlers.editQuest,
  options: {
    id: "v1.quest.editQuest",
    tags: ["api", "quest"],
    description: "Edit quest",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        workplace: workPlaceSchema.required(),
        typeOfEmployment: questEmploymentSchema.required(),
        payPeriod: payPeriodSchema.required(),
        priority: prioritySchema.required(),
        locationFull: locationFullSchema.required(),
        medias: idsSchema.unique().required(),
        specializationKeys: specializationKeysSchema.unique().required(),
      }).label('EditQuestPayload'),
    },
    response: {
      schema: outputOkSchema(questSchema).label('EditQuestResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/quest/{questId}/block-history",
  handler: handlers.getQuestBlockingHistory,
  options: {
    id: "v1.quest.getBlockHistory",
    tags: ["api", "quest"],
    description: "Show quest block story",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      params: Joi.object({
        questId: idSchema.required()
      }).label('GetQuestBlockingHistoryParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestBlockingHistoryQuery'),
    },
    response: {
      schema: outputPaginationSchema('blackLists', questBlackListSchema).label('GetQuestBlockingHistoryResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/block",
  handler: handlers.blockQuest,
  options: {
    id: "v1.quest.blockQuest",
    tags: ["api", "quest"],
    description: "Block quest",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("BlockQuestParams"),
      payload: Joi.object({
        blockReason: questBlackListReasonSchema.required(),
      }).label('BlockQuestSchema')
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/{questId}/unblock",
  handler: handlers.unblockQuest,
  options: {
    id: "v1.quest.unblockQuest",
    tags: ["api", "quest"],
    description: "Unblock quest",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("UnblockQuestParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/quest/{questId}",
  handler: handlers.deleteQuest,
  options: {
    id: "v1.quest.deleteQuest",
    tags: ["api", "quest"],
    description: "Delete quest",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("DeleteQuestParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}];
