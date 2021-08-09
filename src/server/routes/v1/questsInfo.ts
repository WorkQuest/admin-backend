import * as Joi from "joi";
import {getQuestsList, moderateQuest, questInfo} from "../../api/v1/questsInfo";
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
} from "@workquest/database-models/lib/schemes";

export default[{
  method: "GET",
  path: "/v1/quests",
  handler: getQuestsList,
  options: {
    id: "v1.quests.list",
    tags: ["api", "quests"],
    description: "Get list of quests",
    validate: {
      query: adminQuerySchema.label('QuerySchema')
    },
    response: {
      schema: outputOkSchema(questSchema).label('QuestsListResponse')
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
  handler: moderateQuest,
  options: {
    id: "v1.quest.moderateQuest",
    tags: ["api", "quests"],
    description: "Moderate quest",
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
},]

