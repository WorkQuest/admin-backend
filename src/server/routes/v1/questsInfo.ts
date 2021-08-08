import * as Joi from "joi";
import { getQuestsList } from "../../api/v1/questsInfo";
import {
  outputOkSchema,
  questSchema,
  adminQuerySchema
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
},]

