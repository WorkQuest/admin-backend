import * as Joi from "joi";
import { getQuestsList, questInfo } from "../../api/v1/questsInfo";
import {
  outputOkSchema,
  questSchema,
  adminQuerySchema,
  idSchema
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
      }).label("QuestResponseParams"),
    },
    response: {
      schema: outputOkSchema(questSchema).label('QuestInfoResponse')
    }
  }
},]

