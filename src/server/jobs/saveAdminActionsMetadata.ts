import { addJob } from '../utils/scheduler';
import { HTTPVerb } from '@workquest/database-models/lib/models';

export type saveAdminActionsPayload = {
  adminId: string,
  HTTPVerb: HTTPVerb,
  path: string,
};

export async function saveAdminActionsMetadataJob(payload: saveAdminActionsPayload) {
  return addJob('saveAdminActionsMetadata', payload);
}
