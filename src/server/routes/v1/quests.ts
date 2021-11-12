import * as Joi from "joi";
import {
  blockQuest,
  deleteQuest,
  editQuest,
  getQuestsList, getUserQuestsInfo,
  questInfo
} from "../../api/v1/quests";
import {
  blockReasonSchema,
  emptyOkSchema,
  idSchema,
  idsSchema, limitSchema,
  locationSchema, offsetSchema,
  outputOkSchema,
  outputPaginationSchema, questBlockReasonSchema,
  questDescriptionSchema,
  questPriceSchema,
  questPrioritySchema,
  questSchema,
  questTitleSchema,
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";

export default[{
  method: "GET",
  path: "/v1/quests",
  handler: getQuestsList,
  options: {
    id: "v1.quests.list",
    tags: ["api", "quests"],
    description: "Get list of quests",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('QuestQuery'),
    },
    response: {
      schema: outputPaginationSchema('questsList',questSchema).label('QuestsListResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/quest/{questId}",
  handler: questInfo,
  options: {
    id: "v1.quest.info",
    tags: ["api", "quests"],
    description: "Get info about quest",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("GetQuestParams"),
    },
    response: {
      schema: outputOkSchema(questSchema).label('QuestInfoResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/quests",
  handler: getUserQuestsInfo,
  options: {
    id: "v1.user.quests.info",
    tags: ["api", "quests"],
    description: "Get info about quests of the user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserParams"),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('QuestQuery'),
    },
    response: {
      schema: outputPaginationSchema('questsList', questSchema).label('QuestInfoResponse')
    }
  }
}, {
  method: "PUT",
  path: "/v1/edit/quest/{questId}",
  handler: editQuest,
  options: {
    id: "v1.quest.editQuest",
    tags: ["api", "quests"],
    description: "Edit quest",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({
        title: questTitleSchema,
        description: questDescriptionSchema,
        medias: idsSchema.unique().label('MediaIds'),
        location: locationSchema,
        priority: questPrioritySchema,
        price: questPriceSchema,
      }).label('EditQuestSchema')
    },
    response: {
      schema: outputOkSchema(questSchema).label('QuestInfoResponse')
    }
  }
}, {
  method: "PUT",
  path: "/v1/block/quest/{questId}",
  handler: blockQuest,
  options: {
    id: "v1.quest.blockQuest",
    tags: ["api", "quests"],
    description: "Block quest",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("BlockQuestParams"),
      payload: Joi.object({
        blockReason: blockReasonSchema,
      }).label('BlockQuestSchema')
    },
    response: {
      schema: questBlockReasonSchema
    }
  }
}, {
  method: "DELETE",
  path: "/v1/quest/{questId}",
  handler: deleteQuest,
  options: {
    id: "v1.quest.deleteQuest",
    tags: ["api", "quests"],
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
},]

