import * as Joi from "joi";
import * as handlers from "../../api/v1/disputes";
import { getRbacSettings } from "../../utils/auth";
import { AdminRole } from "@workquest/database-models/lib/models";
import {
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  questDisputeSchema,
  outputPaginationSchema,
  questDisputeQuerySchema,
  questDisputeReviewSchema,
  questDisputeStatusesSchema,
  questDisputeDecisionSchema,
  questDisputeDecisionDescriptionSchema, questDisputeDecisionsSchema,
} from "@workquest/database-models/lib/schemes";

export default[{
  method: "GET",
  path: "/v1/quest/dispute/{disputeId}",
  handler: handlers.getQuestDispute,
  options: {
    id: "v1.quest.getDispute",
    tags: ["api", "quest-dispute"],
    description: "Get quest dispute",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("GetQuestDisputeParams"),
    },
    response: {
      schema: outputOkSchema(questDisputeSchema).label('GetQuestDisputeResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/user/{userId}/quest/disputes",
  handler: handlers.getQuestDisputes,
  options: {
    id: "v1.user.quest.getUserQuestDisputes",
    tags: ["api", "quest-dispute"],
    description: "Get info about disputes of the user",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
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
    description: "Get all disputes",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
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
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
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
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("QuestDisputeDecideParams"),
      payload: Joi.object({
        decision: questDisputeDecisionSchema,
        decisionDescription: questDisputeDecisionDescriptionSchema.required(),
      }).label('DisputeDecisionSchema')
    },
    response: {
      schema: outputOkSchema(questDisputeSchema).label('QuestDisputeDecideResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/quest/dispute/reviews',
  handler: handlers.getQuestDisputeReviews,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main),
    id: 'v1.quest.dispute.getQuestDisputeReviews',
    tags: ['api', "quest-dispute"],
    description: 'Get quest disputes admins reviews',
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestDisputeReviewsQuery'),
    },
    response: {
      schema: outputPaginationSchema('reviews', questDisputeReviewSchema).label('GetQuestDisputeReviewsResponse'),
    },
  },
}, {
  method: "GET",
  path: "/v1/admin/{adminId}/quest/dispute/reviews",
  handler: handlers.getQuestDisputeReviews,
  options: {
    id: "v1.admin.quest.dispute.getQuestDisputeReviewsForAdmin",
    tags: ["api", "quest-dispute"],
    description: "Get quest disputes admin reviews",
    plugins: getRbacSettings(AdminRole.Main),
    validate: {
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("GetQuestDisputeReviewsForAdminParams"),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestDisputeReviewsForAdminQuery'),
    },
    response: {
      schema: outputPaginationSchema('reviews', questDisputeReviewSchema).label('GetQuestDisputeReviewsForAdminResponse')
    }
  }
}, {
  method: 'GET',
  path: '/v1/admin/me/quest/dispute/reviews',
  handler: handlers.getQuestDisputeReviewsForAdminMe,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    id: 'v1.admin.me.quest.dispute.getQuestDisputeAdminReviewMe',
    tags: ['api', "quest-dispute"],
    description: 'Get questDisputes admin (me) review',
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestDisputesAdminReviewMeQuery'),
    },
    response: {
      schema: outputPaginationSchema('reviews', questDisputeReviewSchema).label('GetQuestDisputesAdminReviewMeResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/quest/dispute/{disputeId}/reviews',
  handler: handlers.getQuestDisputeReviews,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    id: 'v1.admin.quest.dispute.getQuestDisputeReviewsByDispute',
    tags: ['api', "quest-dispute"],
    description: 'Get quest dispute reviews by dispute',
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label('GetQuestDisputeReviewsByDisputeParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestDisputeReviewsByDisputeQuery'),
    },
    response: {
      schema: outputPaginationSchema('reviews', questDisputeReviewSchema).label('GetQuestDisputeReviewsByDisputeResponse'),
    },
  },
}, {
  method: 'GET',
  path: '/v1/quest/{questId}/dispute/reviews',
  handler: handlers.getQuestDisputeReviews,
  options: {
    auth: 'jwt-access',
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    id: 'v1.admin.quest.dispute.getQuestDisputeReviewsByQuest',
    tags: ['api', "quest-dispute"],
    description: 'Get questDispute reviews by quest',
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label('GetQuestDisputeReviewsByQuestParams'),
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetQuestDisputeReviewsByQuestQuery'),
    },
    response: {
      schema: outputPaginationSchema('reviews', questDisputeReviewSchema).label('GetQuestDisputeReviewsByQuestResponse'),
    },
  },
}, {
  method: "GET",
  path: "/v1/admin/{adminId}/quest/disputes",
  handler: handlers.getQuestDisputes,
  options: {
    id: "v1.admin.quest.getAdminQuestDisputes",
    tags: ["api", "quest-dispute"],
    description: "Get info about disputes of the admin",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    validate: {
      query: Joi.object({
        statuses: questDisputeStatusesSchema,
        decisions: questDisputeDecisionsSchema,
        limit: limitSchema,
        offset: offsetSchema,
      }).label('GetAdminQuestDisputesQuery'),
      params: Joi.object({
        adminId: idSchema.required(),
      }).label("GetAdminQuestDisputesParams"),
    },
    response: {
      schema: outputPaginationSchema('disputes', questDisputeSchema).label('GetAdminQuestDisputesResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/quest/{questId}/disputes",
  handler: handlers.getQuestDisputes,
  options: {
    id: "v1.quest.getDisputes",
    tags: ["api", "quest-dispute"],
    description: "Get quest disputes",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Dispute),
    validate: {
      params: Joi.object({
        questId: idSchema.required(),
      }).label("GetQuestDisputesParams"),
    },
    response: {
      schema: outputPaginationSchema('disputes', questDisputeSchema).label('GetQuestDisputesResponse')
    }
  }
}]

