import { Errors } from "../../utils/errors";
import { output, error} from "../../utils";
import {Admin, Role} from "database-models/lib/models/Admin"
import { Session } from "database-models/lib/models/Session";
import { checkExisting } from "../../utils/auth";
import * as speakeasy from "speakeasy"

export async function registerAdminAccount(r){
  if(r.auth.credentials.adminRole !== Role.main){
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }
  const checkEmail = await checkExisting(r.payload.email)

  if(checkEmail){
    return error(Errors.AlreadyExist, "Account with this email already exist", {})
  }

  //TOTP
  const { base32 } = speakeasy.generateSecret({ length: 10, name: 'AdminWokQuest'})

  await Admin.create({
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
  return output( base32 );
}

export async function deleteAdminAccount(r){
    if(r.auth.credentials.adminRole !== Role.main){
      return error(Errors.InvalidAdminType, 'Invalid admin type', {})
    }

    if(r.params.userId === r.auth.credentials.id){
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