import * as Joi from "joi";
import {
  disputeDecision,
  getDisputeInfo,
  takeDispute,
  deleteDispute, getActiveDisputesInfo,
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
  handler: getDisputeInfo,
  options: {
    id: "v1.dispute.info",
    tags: ["api", "disputes"],
    description: "Get info about dispute",
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
  method: "POST",
  path: "v1/dispute/{disputeId}/takeDispute",
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
  path: "v1/dispute/{disputeId}/decision",
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
  path: "v1/dispute/{disputeId}/delete",
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
},]

