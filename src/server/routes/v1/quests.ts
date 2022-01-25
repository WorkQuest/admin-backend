import * as Joi from "joi";
import * as handlers from "../../api/v1/quests";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";
import {
  idSchema,
  idsSchema,
  questSchema,
  limitSchema,
  offsetSchema,
  emptyOkSchema,
  locationSchema,
  prioritySchema,
  outputOkSchema,
  workPlaceSchema,
  questPriceSchema,
  questTitleSchema,
  questAdTypeSchema,
  questCategorySchema,
  questEmploymentSchema,
  questDescriptionSchema,
  questBlockReasonSchema,
  outputPaginationSchema,
  specializationKeysSchema,
  questsForGetWithCountSchema,
  questLocationPlaceNameSchema,
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
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestsQuery'),
    },
    response: {
      schema: outputOkSchema(questsForGetWithCountSchema).label("GetQuestsResponse")
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
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("GetQuestParams"),
    },
    response: {
      schema: outputOkSchema(questSchema).label('GetQuestResponse')
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
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUsersQuestsParams"),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUsersQuestsQuery'),
    },
    response: {
      schema: outputPaginationSchema('quests', questSchema).label('GetUsersQuestsResponse')
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
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        category: questCategorySchema.required(),
        workplace: workPlaceSchema.required(),
        employment: questEmploymentSchema.required(),
        priority: prioritySchema.required(),
        location: locationSchema.required(),
        locationPlaceName: questLocationPlaceNameSchema.required(),
        title: questTitleSchema.required(),
        description: questDescriptionSchema.required(),
        price: questPriceSchema.required(),
        adType: questAdTypeSchema.required(),
        medias: idsSchema.unique().required(),
        specializationKeys: specializationKeysSchema.unique().required(),
      }).label('EditQuestPayload'),
    },
    response: {
      schema: outputOkSchema(questSchema).label('EditQuestResponse')
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
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("BlockQuestParams"),
      payload: Joi.object({
        blockReason: questBlockReasonSchema,
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
    plugins: getRbacSettings(AdminRole.main),
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
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("DeleteQuestParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}]

