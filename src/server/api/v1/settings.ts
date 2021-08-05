import { Errors } from "../../utils/errors";
import { output, error} from "../../utils";
import {Admin, Role, Session} from "@workquest/database-models/lib/models"
import * as speakeasy from "speakeasy"


export async function registerAdminAccount(r) {
  // if(r.auth.credentials.adminRole !== Role.main) {
  //   return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  // }

  if(await Admin.isEmailExist(r.payload.email)) {
    return error(Errors.AlreadyExist, "Account with this email already exist", {})
  }

  //TOTP
  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'AdminWokQuest'})

  const newAdmin = await Admin.create({
    firstName: r.payload.firstName,
    lastName: r.payload.lastName,
    email: r.payload.email,
    adminRole: r.payload.adminRole,
    password: r.payload.password,
    settings: {
      security: {
        TOTP: {
          secret: base32
        }
      }
    }
  })
  return output( {data: newAdmin, secret: base32} );
}

export async function deleteAdminAccount(r) {
  if(r.auth.credentials.adminRole !== Role.main) {
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }

  if(r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not delete your own account', {})
  }

  await Session.destroy({
    where: {
      userId: r.params.userId
    },
  })

  const account = await Admin.findByPk(r.params.userId)

  await account.destroy()
  return output();
}

export async function activateAdminAccount(r) {
  if(r.auth.credentials.adminRole !== Role.main){
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }

  if(r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not activate your own account', {})
  }

  const account = await Admin.findByPk(r.params.userId)

  if(!account.isActive) {
    account.update({
      isActive: true,
    })
    return output()
  }

  return error(Errors.AlreadyExist, 'Account already activated', {})

}

export async function deactivateAdminAccount(r) {
  if(r.auth.credentials.adminRole !== Role.main) {
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }

  if(r.params.userId === r.auth.credentials.id) {
    return error(Errors.InvalidUserId, 'Can not deactivate your own account', {})
  }

  const account = await Admin.findByPk(r.params.userId)

  if(account.isActive) {
    account.update({
      isActive: false,
    })
    return output()
  }
  return error(Errors.AlreadyExist, 'Account already deactivated', {})
}

export async function changeLogin(r) {
  if(r.auth.credentials.adminRole !== Role.main){
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }

  const account = await Admin.findByPk(r.params.userId)
  if(!account) {
    return error(Errors.NotFound, 'Account not found', {})
  }

  if(await Admin.isEmailExist(r.payload.newLogin)) {
    return error(Errors.AlreadyExist, 'Email already exist', {})
  }

  const admin = await Admin.scope("withPassword").findByPk(r.auth.credentials.id)
  if(!await admin.validateTOTP(r.payload.totp)) {
    throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  }

  await account.update({
    email: r.payload.newLogin
  })

  return output()
}

export async function changePassword(r) {
  if(r.auth.credentials.adminRole !== Role.main) {
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }

  const account = await Admin.scope("withPassword").findByPk(r.params.userId)
  if(await account.passwordCompare(r.payload.newPassword)) {
    return error(Errors.AlreadyExist, "New password is the same with the old one", {})
  }

  const admin = await Admin.scope("withPassword").findByPk(r.auth.credentials.id)
  if(!await admin.validateTOTP(r.payload.totp)) {
    throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  }

  await account.update({
    password: r.payload.newPassword
  })

  return output()
}
