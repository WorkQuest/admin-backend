import * as Joi from "joi";
import * as handlers from "../../api/v1/support";
import { getRbacSettings } from "../../utils/auth";
import { AdminRole } from "@workquest/database-models/lib/models";
import {
  idSchema,
  limitSchema,
  offsetSchema,
  outputOkSchema,
  supportTicketSchema,
  outputPaginationSchema,
  supportTicketQuerySchema,
  statusSupportTicketSchema,
  descriptionSupportTicketSchema,
  postedDecisionSupportTicketSchema, sortDirectionSchema,
} from "@workquest/database-models/lib/schemes";

export default [{
  method: "GET",
  path: "/v1/support/user-ticket/{ticketId}",
  handler: handlers.getSupportTicket,
  options: {
    id: "v1.support.userTicket.getTicket",
    tags: ["api", "support"],
    description: "Get support tickets",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Support),
    validate: {
      params: Joi.object({
        ticketId: idSchema.required(),
      }).label("GetSupportTicketParams"),
    },
    response: {
      schema: outputOkSchema(supportTicketSchema).label('GetSupportTicketResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/support/user-ticket/{userId}/tickets",
  handler: handlers.getSupportUserTickets,
  options: {
    id: "v1.support.userTicket.getUserTickets",
    tags: ["api", "support"],
    description: "Get info about support tickets of the user",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Support),
    validate: {
      query: Joi.object({
        limit: limitSchema,
        offset: offsetSchema,
        sort: Joi.object({
          createdAt: sortDirectionSchema.default('DESC'),
        }).default({ createdAt: 'DESC' }).label('SortTickets'),
      }).label('GetUserSupportTicketsQuery'),
      params: Joi.object({
        userId: idSchema.required(),
      }).label("GetUserSupportTicketsParams"),
    },
    response: {
      schema: outputPaginationSchema('tickets', supportTicketSchema).label('GetSupportUserTicketsResponse')
    }
  }
}, {
  method: "GET",
  path: "/v1/support/user-ticket/tickets",
  handler: handlers.getTickets,
  options: {
    id: "v1.support.userTicket.getTickets",
    tags: ["api", "support"],
    description: "Get all support tickets",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Support),
    validate: {
      query: supportTicketQuerySchema,
      sort: Joi.object({
        createdAt: sortDirectionSchema.default('DESC'),
      }).default({ createdAt: 'DESC' }).label('SortTickets'),
    },
    response: {
      schema: outputPaginationSchema('tickets', supportTicketSchema).label('GetSupportTicketsResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/support/user-ticket/{ticketId}/take",
  handler: handlers.takeTicketToResolve,
  options: {
    id: "v1.support.userTicket.takeTicket",
    tags: ["api", "support"],
    description: "Admin take support ticket",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Support),
    validate: {
      params: Joi.object({
        ticketId: idSchema.required(),
      }).label("TakeSupportTicketParams"),
    },
    response: {
      schema: outputOkSchema(supportTicketSchema).label('TakeSupportTicketResponse')
    }
  }
}, {
  method: "POST",
  path: "/v1/support/user-ticket/{ticketId}/decide",
  handler: handlers.ticketDecide,
  options: {
    id: "v1.support.userTicket.decide",
    tags: ["api", "support"],
    description: "Admin resolve support ticket",
    plugins: getRbacSettings(AdminRole.Main, AdminRole.Support),
    validate: {
      params: Joi.object({
        ticketId: idSchema.required(),
      }).label("SupportTicketDecideParams"),
      payload: Joi.object({
        decisionPostedIn: postedDecisionSupportTicketSchema.required(),
        decisionDescription: descriptionSupportTicketSchema,
        status: statusSupportTicketSchema.required()
      }).label('SupportTicketSchema')
    },
    response: {
      schema: outputOkSchema(supportTicketSchema).label('SupportTicketDecideResponse')
    }
  }
}]
