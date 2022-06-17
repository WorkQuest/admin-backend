import * as speakeasy from "speakeasy"
import {Errors} from "../../utils/errors";
import {error, output} from "../../utils";
import {saveAdminActionsMetadataJob} from "../../jobs/saveAdminActionsMetadata";
import {
  Admin,
  AdminRole,
  AdminSession,
} from "@workquest/database-models/lib/models"

export async function getAdmins(r) {
  const { count, rows } = await Admin.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, admins: rows });
}

export async function getAdmin(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, "Admin is not found", {});
  }

  return output(admin);
}

export async function getAdminSessions(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Admin is not found', {});
  }

  const { rows, count } = await AdminSession.findAndCountAll({
    include: { model: Admin, as: 'admin', required: true },
    limit: r.query.limit,
    offset: r.query.offset,
    where: { adminId: admin.id },
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, sessions: rows });
}

export async function getAdminsSessions(r) {
  const { rows, count } = await AdminSession.findAndCountAll({
    include: { model: Admin, as: 'admin', required: true },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [ ['createdAt', 'DESC'] ],
  });

  return output({ count: count, sessions: rows });
}

export async function createAdminAccount(r) {
  if (await Admin.isEmailExist(r.payload.email)) {
    return error(Errors.AlreadyExists, "Account with this email already exist", {});
  }

  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'AdminWorkQuest'});

  const newAdmin = await Admin.create({
    firstName: r.payload.firstName,
    lastName: r.payload.lastName,
    email: r.payload.email,
    role: r.payload.adminRole,
    password: r.payload.password,
    isActive: true,
    settings: {
      security: {
        TOTP: { secret: base32 }
      }
    },
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output({
    admin: await Admin.findByPk(newAdmin.id),
    secret: base32,
  });
}

export async function deleteAdminAccount(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  /** TODO: controller */
  if (r.auth.credentials.id === r.params.adminId) {
    return error(Errors.InvalidType, 'Can not delete your own account', {});
  }

  if (!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }

  await admin.update({ email: null })
    .then(async () => await admin.destroy());


  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function activateAdminAccount(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }
  if (admin.role === AdminRole.Main) {
    return error(Errors.InvalidType, 'Can not activate your own account', {});
  }

  await admin.update({ isActive: true });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function deactivateAdminAccount(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }
  if (admin.role === AdminRole.Main) {
    return error(Errors.InvalidType, 'Can not deactivate your own account', {});
  }

  await admin.update({
    isActive: false
  });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function changeEmail(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Account not found', {});
  }

  if (await Admin.isEmailExist(r.payload.email)) {
    return error(Errors.InvalidType, 'Email already exist', {});
  }

  await admin.update({ email: r.payload.email });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function changePassword(r) {
  const admin = await Admin.scope("withPassword").findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Account not found', {});
  }

  if (await admin.passwordCompare(r.payload.newPassword)) {
    return error(Errors.InvalidType, "New password is the same with the old one", {});
  }

  await admin.update({ password: r.payload.newPassword });

  await saveAdminActionsMetadataJob({ adminId: r.auth.credentials.id, HTTPVerb: r.method, path: r.path });

  return output();
}

export async function changeAdminRole(r) {
}

