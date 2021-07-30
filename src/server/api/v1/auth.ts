import { Errors } from "../../utils/errors";
import { addSendEmailJob } from "../../jobs/sendEmail";
import config from "../../config/config";
import { output, error, getHexConfirmToken,validCaptcha } from "../../utils";
import { Admin, Role } from "../../models/Admin";
import * as moment from "moment";
import * as path from "path";
import * as fs from "fs";
import Handlebars = require("handlebars");
import { Session } from "../../models/Session";
import { generateJwt } from "../../utils/auth";
import { Op } from "sequelize";
import auth from "../../routes/v1/auth";

export async function checkExisting(email: string) {
  const checkEmail = await Admin.findOne({
    where: {
      email: email,
    }
  })
  if(checkEmail){
    return true
  }

  return false
}

export async function registerAccount(r){
  console.log(r.auth)
  if(r.auth.credentials.adminRole !== Role.main){
    error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }
  const checkEmail = await checkExisting(r.payload.email)

  if(checkEmail){
    return error(Errors.AlreadyExist, "Account with this email already exist", {})
  }

  let admin = await Admin.create({
    firstName: r.payload.firstName,
    lastName: r.payload.lastName,
    email: r.payload.email,
    adminRole: r.payload.role,
    password: r.payload.password,
  })

  const session = await Session.create({
    userId: admin.id
  });
  return output({ ...generateJwt({ id: session.id })});
}

export async function login(r) {
  const account = await Admin.scope("withPassword").findOne({
    where: {
      email: { [Op.iLike]: r.payload.email }
    }
  });
  //password validation

  if (!account)
    return error(Errors.NotFound, "Account not found", {});
  if (!await account.passwordCompare(r.payload.password))
    return error(Errors.NotFound, "Invalid password", {});
  
  console.log(account.id)
  const session = await Session.create({
    userId: account.id
  });

  return output({ ...generateJwt({ id: session.id })});
}