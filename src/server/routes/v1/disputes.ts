import * as Joi from "joi";
import {
  disputeDecision,
  getQuestDispute,
  takeDisputeToResolve,
  deleteDispute,
  getActiveDisputes,
  getUserDisputes,
  getDisputesByStatus,
  getAdminDisputes,
  adminResolvedDisputes
} from "../../api/v1/disputes";
import {
  adminDecisionSchema,
  adminIdParams,
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
  handler: getQuestDispute,
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
  handler: getUserDisputes,
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
  handler: getActiveDisputes,
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
  method: "GET",
  path: "/v1/pending/disputes",
  handler: getDisputesByStatus(DisputeStatus.pending),
  options: {
    id: "v1.disputes.pending",
    tags: ["api", "disputes"],
    description: "Get info about pending disputes",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      query: disputesQuerySchema.label('QuerySchema')
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputesInfoResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/in-process/disputes",
  handler: getDisputesByStatus(DisputeStatus.inProgress),
  options: {
    id: "v1.disputes.inProcess",
    tags: ["api", "disputes"],
    description: "Get info about in-progress disputes",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      query: disputesQuerySchema.label('QuerySchema')
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputesInfoResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/completed/disputes",
  handler: getDisputesByStatus(DisputeStatus.completed),
  options: {
    id: "v1.disputes.completed",
    tags: ["api", "disputes"],
    description: "Get info about completed disputes",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      query: disputesQuerySchema.label('QuerySchema')
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputesInfoResponse')
    }
  }
}, {
  method: "PUT",
  path: "/v1/dispute/{disputeId}/takeDispute",
  handler: takeDisputeToResolve,
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
  method: "PUT",
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
}, {
  method: "GET",
  path: "/v1/admin/{adminId}/disputes",
  handler: getAdminDisputes,
  options: {
    id: "v1.admin.completed.disputesByAdmin",
    tags: ["api", "disputes"],
    description: "Get info about completed disputes of admin",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      params: adminIdParams.label('AdminAccountParams'),
      query: disputesQuerySchema.label('QuerySchema'),
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputesInfoResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/admin/{adminId}/completed-disputes",
  handler: adminResolvedDisputes,
  options: {
    id: "v1.admin.completed.disputes",
    tags: ["api", "disputes"],
    description: "Get info about completed disputes of admin",
    plugins: getRbacSettings(AdminRole.main, AdminRole.dispute),
    validate: {
      query: disputesQuerySchema.label('QuerySchema'),
    },
    response: {
      schema: outputPaginationSchema('disputes', disputeSchema).label('DisputesInfoResponse')
    }
  }
},]

