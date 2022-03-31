import { addJob } from '../utils/scheduler';
import { AdminActionMetadata, HTTPVerb } from '@workquest/database-models/lib/models';

export type saveAdminActionsPayload = {
  adminId: string,
  HTTPVerb: HTTPVerb,
  path: string,
};

export async function saveAdminActionsMetadataJob(payload: saveAdminActionsPayload) {
  return addJob('saveAdminActionsMetadata', payload);
}

export default async function(payload: saveAdminActionsPayload) {
  await AdminActionMetadata.create({
    adminId: payload.adminId,
    HTTPVerb: payload.HTTPVerb,
    path: payload.path,
  });
}
