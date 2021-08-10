import * as Joi from "joi";
import {getQuestsList, editQuest, questInfo, deleteQuest, getDispute} from "../../api/v1/questsInfo";
import {
  outputOkSchema,
  questSchema,
  adminQuerySchema,
  idSchema,
  questTitleSchema,
  questDescriptionSchema,
  questPrioritySchema,
  locationSchema,
  questPriceSchema,
  mediaIdsSchema,
  emptyOkSchema, outputPaginationSchema,
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";
import {disputeSchema} from "@workquest/database-models/lib/schemes/disputes";

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
      query: adminQuerySchema.label('QuerySchema')
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
  method: "PUT",
  path: "/v1/quest/{questId}",
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
        medias: mediaIdsSchema.unique().label('MediaIds'),
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
  method: "DELETE",
  path: "v1/quest/{questId}",
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
}, {
  method: "GET",
  path: "/v1/quest/disputes/{questId}",
  handler: getDispute,
  options: {
    id: "v1.disputes.info",
    tags: ["api", "disputes"],
    description: "Get info about disputes",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("GetQuestParams"),
    },
    response: {
      schema: outputOkSchema(disputeSchema).label('DisputeInfoResponse')
    }
  }
}, ]

