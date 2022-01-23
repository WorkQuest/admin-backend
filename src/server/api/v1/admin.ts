import * as speakeasy from "speakeasy"
import {Errors} from "../../utils/errors";
import {error, output} from "../../utils";
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

  return output({
    admin: await Admin.findByPk(newAdmin.id),
    secret: base32,
  });
}

export async function deleteAdminAccount(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }
  if (admin.role === AdminRole.main) {
    return error(Errors.InvalidType, 'Can not delete your own account', {});
  }

  await admin.destroy();

  return output();
}

export async function activateAdminAccount(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }
  if (admin.role === AdminRole.main) {
    return error(Errors.InvalidType, 'Can not activate your own account', {});
  }

  await admin.update({ isActivated: true });

  return output();
}

export async function deactivateAdminAccount(r) {
  const admin = await Admin.findByPk(r.params.adminId);

  if (!admin) {
    return error(Errors.NotFound, 'Account is not found', {});
  }
  if (admin.role === AdminRole.main) {
    return error(Errors.InvalidType, 'Can not deactivate your own account', {});
  }

  await admin.update({
    isActivated: false
  });

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

  return output();
}
