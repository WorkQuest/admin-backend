import * as speakeasy from "speakeasy"
import {Errors} from "../../utils/errors";
import {error, output} from "../../utils";
import {Admin, Role} from "@workquest/database-models/lib/models"

export async function getAdmins(r) {
  r.auth.credentials.checkAdminRole(Role.main);

  // TODO добавить фильтры,
  const { count, rows } = await Admin.findAndCountAll();

  return output({ count, admins: rows });
}

export async function registerAdminAccount(r) {
  r.auth.credentials.checkAdminRole(Role.main); // TODO mustHaveRole

  if (await Admin.isEmailExist(r.payload.email)) {
    return error(Errors.AlreadyExist, "Account with this email already exist", {})
  }

  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'AdminWokQuest'})

  const newAdmin = await Admin.create({
    firstName: r.payload.firstName,
    lastName: r.payload.lastName,
    email: r.payload.email,
    adminRole: r.payload.adminRole,
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
  r.auth.credentials.checkAdminRole(Role.main); // TODO MustHave Role

  if (r.params.userId === r.auth.credentials.id) {
    // TODO error
  }

  const subAdmin = await Admin.findByPk(r.params.userId);

  if (!subAdmin) {
    // TODO: error
  }

  await subAdmin.destroy();

  return output();
}

export async function activateAdminAccount(r) {
  r.auth.credentials.checkAdminRole(Role.main);

  if (r.params.userId === r.auth.credentials.id) {
    // TODO error
  }

  const subAdmin = await Admin.findByPk(r.params.userId);

  if (!subAdmin) {
    // TODO: error
  }

  await subAdmin.update({
    isActive: true
  });

  return output();
}

export async function deactivateAdminAccount(r) {
  r.auth.credentials.checkAdminRole(Role.main);

  if (r.params.userId === r.auth.credentials.id) {
    // TODO error
  }

  const subAdmin = await Admin.findByPk(r.params.userId);

  if (!subAdmin) {
    // TODO: error
  }

  await subAdmin.update({
    isActive: false
  });

  return output();
}

export async function changeLogin(r) {
  r.auth.credentials.checkAdminRole(Role.main);

  if (r.params.userId === r.auth.credentials.id) {
    // TODO error
  }

  const subAdmin = await Admin.findByPk(r.params.userId); // TODO: adminId везде исправь

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
  r.auth.credentials.checkAdminRole(Role.main);

  const subAdmin = await Admin.scope("withPassword").findByPk(r.params.userId);

  if(await subAdmin.passwordCompare(r.payload.newPassword)) {
    return error(Errors.AlreadyExist, "New password is the same with the old one", {})
  }

  await subAdmin.update({
    password: r.payload.newPassword // TODO проверь в базе, чтобы он хеш пароля сохранял, а не сам пароль
  })

  return output();
}
