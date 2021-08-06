import {Errors} from "../../utils/errors";
import {error, output} from "../../utils";
import {Admin, AdminSession, Role} from "@workquest/database-models/lib/models"
import * as speakeasy from "speakeasy"
import { paginate } from "../operations/paginate";

export function getAdminsList(role: Role) {
  return async function(r) {
    r.auth.credentials.checkAdminRole(role)
    
    const admins = await Admin.findAndCountAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'adminRole'],
      ...paginate(r),
      order: [['createdAt', 'DESC']]
    })
    return output({ data: admins.rows, count: admins.count })
  }
}


export function registerAdminAccount(role: Role) {
  return async function(r) {
    r.auth.credentials.checkAdminRole(role)
  
    if(await Admin.isEmailExist(r.payload.email)) {
      return error(Errors.AlreadyExist, "Account with this email already exist", {})
    }
  
    //TOTP
    const { base32 } = speakeasy.generateSecret({ length: 10, name: 'AdminWokQuest'})
  
    let newAdmin = await Admin.create({
      firstName: r.payload.firstName,
      lastName: r.payload.lastName,
      email: r.payload.email,
      adminRole: r.payload.adminRole,
      password: r.payload.password,
      isActive: true,
      settings: {
        security: {
          TOTP: {
            secret: base32
          }
        }
      }
    })
  
    newAdmin = await Admin.scope('defaultScope').findByPk(newAdmin.id)
  
    return output( {data: newAdmin, secret: base32} );  }

}

export function deleteAdminAccount(role: Role) {
  return async function(r) {
    r.auth.credentials.checkAdminRole(role)
  
    if(r.params.userId === r.auth.credentials.id) {
      return error(Errors.InvalidUserId, 'Can not delete your own account', {})
    }
  
    await AdminSession.destroy({
      where: {
        userId: r.params.userId
      },
    })
  
    const account = await Admin.findByPk(r.params.userId)
  
    await account.destroy()
    return output();
  }
}

export function activateAdminAccount(role: Role) {
  return async function(r) {
    r.auth.credentials.checkAdminRole(role)
  
    if(r.params.userId === r.auth.credentials.id) {
      return error(Errors.InvalidUserId, 'Can not activate your own account', {})
    }
  
    const account = await Admin.findByPk(r.params.userId)
  
    if(!account.isActive) {
      await account.update({
        isActive: true,
      })
      return output()
    }
  
    return error(Errors.AlreadyExist, 'Account already activated', {})
  }
}

export function deactivateAdminAccount(role: Role) {
  return async function(r) {
    r.auth.credentials.checkAdminRole(role)
  
    if(r.params.userId === r.auth.credentials.id) {
      return error(Errors.InvalidUserId, 'Can not deactivate your own account', {})
    }
  
    const account = await Admin.findByPk(r.params.userId)
  
    if(account.isActive) {
      await account.update({
        isActive: false,
      })
      return output()
    }
    return error(Errors.AlreadyExist, 'Account already deactivated', {})
  }
}

export function changeLogin(role: Role) {
  return async function(r) {
    r.auth.credentials.checkAdminRole(role)
  
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
  

}

export function changePassword(role: Role) {
  return async function(r) {
    r.auth.credentials.checkAdminRole(role)
  
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
}
