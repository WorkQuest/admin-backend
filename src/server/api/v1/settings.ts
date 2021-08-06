import * as speakeasy from "speakeasy"
import {Errors} from "../../utils/errors";
import {error, output} from "../../utils";
import {Admin, AdminRole} from "@workquest/database-models/lib/models"

export async function getAdmins(r) {
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  // TODO добавить фильтры,
  const { count, rows } = await Admin.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return output({ count, admins: rows });
}

export async function registerAdminAccount(r) {
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  if (await Admin.isEmailExist(r.payload.email)) {
    return error(Errors.AlreadyExist, "Account with this email already exist", {})
  }

  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'AdminWokQuest'})

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
    }
  });

  return output({
    admin: await Admin.findByPk(newAdmin.id),
    secret: base32,
  });
}

export async function deleteAdminAccount(r) {
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  if (r.params.adminId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not delete your own account', {})
  }

  const subAdmin = await Admin.findByPk(r.params.adminId);

  if (!subAdmin) {
    return error(Errors.NotFound, 'Account is not found', {})
  }

  await subAdmin.destroy();

  return output();
}

export async function activateAdminAccount(r) {
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  if (r.params.adminId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not activate your own account', {})
  }

  const subAdmin = await Admin.findByPk(r.params.adminId);

  if (!subAdmin) {
    return error(Errors.NotFound, 'Account is not found', {})
  }

  await subAdmin.update({
    isActive: true
  });

  return output();
}

export async function deactivateAdminAccount(r) {
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  if (r.params.adminId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not deactivate your own account', {})
  }

  const subAdmin = await Admin.findByPk(r.params.adminId);

  if (!subAdmin) {
    return error(Errors.InvalidUserId, 'Can not activate your own account', {})
  }

  await subAdmin.update({
    isActive: false
  });

  return output();
}

export async function changeLogin(r) {
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  if (r.params.adminId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not change your own login there', {})
  }

  const subAdmin = await Admin.findByPk(r.params.adminId);

  if (!subAdmin) {
    return error(Errors.NotFound, 'Account not found', {})
  }

  if (await Admin.isEmailExist(r.payload.newLogin)) {
    return error(Errors.AlreadyExist, 'Email already exist', {})
  }

  await subAdmin.update({
    email: r.payload.newLogin
  });

  return output();
}

export async function changePassword(r) {
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);
  
  if (r.params.adminId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not change your own password there', {})
  }
  
  const subAdmin = await Admin.scope("withPassword").findByPk(r.params.adminId);
  
  if (!subAdmin) {
    return error(Errors.NotFound, 'Account not found', {})
  }

  if(await subAdmin.passwordCompare(r.payload.newPassword)) {
    return error(Errors.AlreadyExist, "New password is the same with the old one", {})
  }

  await subAdmin.update({
    password: r.payload.newPassword
  })

  return output();
}
