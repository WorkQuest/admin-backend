import * as Joi from "joi";
import {
  disputeDecision,
  getQuestDisputeInfo,
  takeDispute,
  deleteDispute,
  getActiveDisputesInfo,
  getUserDisputeInfo
} from "../../api/v1/disputes";
import {
  adminDecisionSchema,
  idSchema,
  outputOkSchema,
  outputPaginationSchema,
  disputesQuerySchema,
  disputeSchema,
} from "@workquest/database-models/lib/schemes";
import {getRbacSettings} from "../../utils/auth";
import {AdminRole, QuestDispute , DisputeStatus} from "@workquest/database-models/lib/models";

export default[{
  method: "GET",
  path: "/v1/quest/{questId}/dispute", //Получаем диспут какого-то квеста, поэтому id квеста
  handler: getQuestDisputeInfo,
  options: {
    id: "v1.quest.dispute.info",
    tags: ["api", "disputes"],
    description: "Get info about dispute of the quest",
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
}, {
  method: "GET",
  path: "/v1/user/{userId}/disputes", //Получаем диспут какого-то юзера, поэтому id юзера
  handler: getUserDisputeInfo,
  options: {
    id: "v1.user.disputes.info",
    tags: ["api", "disputes"],
    description: "Get info about disputes of the user",
    plugins: getRbacSettings(AdminRole.main),
    validate: {
      query: disputesQuerySchema.label('QuerySchema'),
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserParams"),
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputeInfoResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/activeDisputes",
  handler: getActiveDisputesInfo,
  options: {
    id: "v1.disputes.info",
    tags: ["api", "disputes"],
    description: "Get info about active disputes",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      query: disputesQuerySchema.label('QuerySchema')
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputesInfoResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/dispute/{disputeId}/takeDispute",
  handler: takeDispute,
  options: {
    id: "v1.disputes.takeDispute",
    tags: ["api", "disputes"],
    description: "Admin take dispute",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("GetDisputeParams"),
    },
    response: {
      schema: outputOkSchema(disputeSchema).label('DisputeDecisionResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/dispute/{disputeId}/decision",
  handler: disputeDecision,
  options: {
    id: "v1.disputes.decision",
    tags: ["api", "disputes"],
    description: "Admin resolve dispute",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("GetDisputeParams"),
      payload: Joi.object({
        decision: adminDecisionSchema,
      }).label('DisputeDecisionSchema')
    },
    response: {
      schema: outputOkSchema(disputeSchema).label('DisputeDecisionResponse')
    }
  }
}, {
  method: "DELETE",
  path: "/v1/dispute/{disputeId}/delete",
  handler: deleteDispute,
  options: {
    id: "v1.disputes.delete",
    tags: ["api", "disputes"],
    description: "Delete dispute",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      params: Joi.object({
        disputeId: idSchema.required(),
      }).label("GetDisputeParams"),
    },
    response: {
      schema: outputOkSchema(disputeSchema).label('DisputeDecisionResponse')
    }
  }
}, ]

