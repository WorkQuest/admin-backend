import { error, output } from "../../utils";
import { Errors } from "../../utils/errors";
import { saveAdminActionsMetadataJob } from "../../jobs/saveAdminActionsMetadata";
import { Admin, SupportTicketForUser, TicketStatus, User } from "@workquest/database-models/lib/models";

export async function getSupportTicket(r) {
  const ticket = await SupportTicketForUser.findByPk(r.params.ticketId, {
    include: [{
      model: User.scope('short'),
      as: 'authorUser'
    }, {
      model: Admin.scope('defaultScope'),
      as: 'resolvedByAdmin'
    }],
    bind: { adminId: r.auth.credentials.id }
  });

  if (!ticket) {
    return error(Errors.NotFound, 'Ticket not found', {});
  }

  return output(ticket);
}

export async function getSupportUserTickets(r) {
  const { count, rows } = await SupportTicketForUser.scope('defaultScope').findAndCountAll({
    where: {
      authorUserId: r.params.userId
    },
    include: [{
      model: User.scope('short'),
      as: 'authorUser'
    }, {
      model: Admin.scope('defaultScope'),
      as: 'resolvedByAdmin'
    }],
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, tickets: rows });
}

export async function getTickets(r) {
  const { count, rows } = await SupportTicketForUser.findAndCountAll({
    where: {
      ...(r.query.status !== undefined && { status: r.query.status })
    },
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, tickets: rows });
}

export async function takeTicketToResolve(r) {
  const ticket = await SupportTicketForUser.findByPk(r.params.ticketId);

  if (!ticket) {
    return error(Errors.NotFound, 'Ticket is not found', {});
  }
  if (ticket.status !== TicketStatus.Pending) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  await ticket.update({
    acceptedAt: Date.now(),
    resolvedByAdminId: r.auth.credentials.id,
  });

  await saveAdminActionsMetadataJob({
    path: r.path,
    HTTPVerb: r.method,
    adminId: r.auth.credentials.id,
  });

  return output(ticket);
}

export async function ticketDecide(r) {
  const ticket = await SupportTicketForUser.findByPk(r.params.ticketId);

  if (!ticket) {
    return error(Errors.NotFound, 'Dispute is not found', {});
  }
  if (ticket.resolvedByAdminId !== r.auth.credentials.id) {
    throw error(Errors.NoRole, 'In processing by another admin', {});
  }
  if (ticket.status === TicketStatus.Pending) {
    throw error(Errors.InvalidStatus, 'Invalid status', {});
  }

  await ticket.update({
    completionAt: Date.now(),
    decisionPostedIn: r.payload.decisionPostedIn,
    decisionDescription: r.payload.decisionDescription,
    status: r.payload.status
  });

  await saveAdminActionsMetadataJob({
    path: r.path,
    HTTPVerb: r.method,
    adminId: r.auth.credentials.id,
  });

  return output(ticket);
}
