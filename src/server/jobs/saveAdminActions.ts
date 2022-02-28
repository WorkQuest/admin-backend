import {addJob} from '../utils/scheduler';
import {AdminActionMetadata, AdminActionMethod} from '@workquest/database-models/lib/models';

export type saveAdminActionsPayload = {
  adminId: string,
  method: AdminActionMethod,
  path: string,
};

export async function saveAdminActionsJob(payload: saveAdminActionsPayload) {
  return addJob('saveAdminActions', payload);
}

export default async function saveAdminActions(payload: saveAdminActionsPayload) {
  await AdminActionMetadata.create({
    adminId: payload.adminId,
    method: payload.method,
    path: payload.path,
  });
}
