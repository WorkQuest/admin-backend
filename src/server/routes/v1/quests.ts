import * as Joi from "joi";
import {
  blockQuest,
  deleteQuest,
  editQuest,
  getQuestsList, getUserQuestsInfo, prolongQuest,
  questInfo
} from "../../api/v1/quests";
import {
  emptyOkSchema,
  idSchema,
  locationSchema,
  mediaIdsSchema,
  outputOkSchema,
  outputPaginationSchema,
  questDescriptionSchema,
  questPriceSchema,
  questPrioritySchema,
  questSchema, questsQuerySchema,
  questTitleSchema,
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole} from "@workquest/database-models/lib/models";

const questBlockReasonSchema = Joi.string().example('Block reason....').label('BlockReasonSchema');

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
      query: questsQuerySchema.label('QuerySchema')
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
      query: questsQuerySchema.label('QuerySchema'),
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
      }).label("EditQuestParams"),
      payload: Joi.object({
        blockReason: questBlockReasonSchema,
      }).label('EditQuestSchema')
    },
    response: {
      schema: emptyOkSchema
    }
  }
},  {
  method: "PUT",
  path: "/v1/prolong/quest/{questId}",
  handler: prolongQuest,
  options: {
    id: "v1.quest.prolongQuest",
    tags: ["api", "quests"],
    description: "Prolong quest",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("EditQuestParams"),
      payload: Joi.object({ //что передавать?
        blockReason: questBlockReasonSchema,
      }).label('EditQuestSchema')
    },
    response: {
      schema: emptyOkSchema
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

