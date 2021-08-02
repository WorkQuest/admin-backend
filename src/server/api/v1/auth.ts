import { Errors } from "../../utils/errors";
import { output, error} from "../../utils";
import {Admin, Role} from "database-models/lib/models/Admin"
import { Session } from "database-models/lib/models/Session";
import { generateJwt, checkExisting } from "../../utils/auth";
import { Op } from "sequelize";
import * as speakeasy from "speakeasy"

export async function registerAccount(r){
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

export async function login(r) {
  const account = await Admin.scope("withPassword").findOne({
    where: {
      email: {
        [Op.iLike]: r.payload.email
      }
    }
  });

  if (!account){
    return error(Errors.NotFound, "Account not found", {});
  }

  if (!await account.passwordCompare(r.payload.password)){
    return error(Errors.NotFound, "Invalid password", {});
  }

  if(!await account.validateTOTP(r.payload.totp)){
    throw error(Errors.InvalidTOTP, "Invalid TOTP", {});
  }

  const session = await Session.create({
    userId: account.id
  });

  return output({ ...generateJwt({ id: session.id })});
}
