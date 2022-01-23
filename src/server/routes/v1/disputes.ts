import * as Joi from "joi";
import {getRbacSettings} from "../../utils/auth";
import * as handlers from "../../api/v1/disputes";
import {AdminRole} from "@workquest/database-models/lib/models";
import {
  idSchema,
  outputOkSchema,
  outputPaginationSchema,
  questDisputeQuerySchema,
  questDisputeSchema, limitSchema, offsetSchema,
  questDisputeDecisionDescriptionSchema, emptyOkSchema,
} from "@workquest/database-models/lib/schemes";

export default[{
  method: "GET",
  path: "/v1/quest/{questId}/dispute",
  handler: handlers.getQuestDispute,
  options: {
    id: "v1.quest.getDispute",
    tags: ["api", "quest-dispute"],
    description: "Get quest dispute",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("GetQuestDisputeParams"),
    },
    response: {
      schema: outputOkSchema(questDisputeSchema).label('GetQuestDisputeResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/quest/disputes",
  handler: handlers.getUserQuestDisputes,
  options: {
    id: "v1.user.quest.getUserQuestDisputes",
    tags: ["api", "quest-dispute"],
    description: "Get info about disputes of the user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetUserQuestDisputesQuery'),
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserQuestDisputesParams"),
    },
    response: {
      schema: outputPaginationSchema('disputes', questDisputeSchema).label('GetUserQuestDisputesResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/quest/disputes",
  handler: handlers.getQuestDisputes,
  options: {
    id: "v1.quest.getQuestDisputes",
    tags: ["api", "quest-dispute"],
    description: "Get disputes",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      query: questDisputeQuerySchema
    },
    response: {
      schema: outputPaginationSchema('disputes', questDisputeSchema).label('GetQuestDisputesResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/dispute/{disputeId}/take",
  handler: handlers.takeDisputeToResolve,
  options: {
    id: "v1.quest.disputes.takeDispute",
    tags: ["api", "quest-dispute"],
    description: "Admin take dispute",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("TakeQuestDisputeParams"),
    },
    response: {
      schema: outputOkSchema(questDisputeSchema).label('TakeQuestDisputeResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/quest/dispute/{disputeId}/decide",
  handler: handlers.disputeDecide,
  options: {
    id: "v1.quest.dispute.decide",
    tags: ["api", "quest-dispute"],
    description: "Admin resolve dispute",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("QuestDisputeDecideParams"),
      payload: Joi.object({
        decisionDescription: questDisputeDecisionDescriptionSchema.required(),
      }).label('DisputeDecisionSchema')
    },
    response: {
      schema: outputOkSchema(questDisputeSchema).label('QuestDisputeDecideResponse')
    }
  }
}, {
  method: "DELETE",
  path: "/v1/quest/dispute/{disputeId}",
  handler: handlers.deleteDispute,
  options: {
    id: "v1.quest.deleteDispute",
    tags: ["api", "quest-dispute"],
    description: "Delete dispute",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("DeleteQuestDisputeParams"),
    },
    response: {
      schema: emptyOkSchema
    }
  }
}, {
  method: "GET",
  path: "/v1/admin/{adminId}/quest/disputes",
  handler: handlers.getAdminDisputes,
  options: {
    id: "v1.admin.quest.getAdminDisputes",
    tags: ["api", "quest-dispute"],
    description: "Get disputes",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("GetAdminQuestDisputesParams"),
      query: questDisputeQuerySchema,
    },
    response: {
      schema: outputPaginationSchema('disputes', questDisputeSchema).label('GetAdminQuestDisputesResponse')
    }
  }
}]

