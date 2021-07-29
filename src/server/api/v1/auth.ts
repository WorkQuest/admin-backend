import { Errors } from "../../utils/errors";
import { addSendEmailJob } from "../../jobs/sendEmail";
import config from "../../config/config";
import { output, error, getHexConfirmToken } from "../../utils";
import { Admin, AdminRole } from "../../models/Admin";
import * as moment from "moment";
import * as path from "path";
import * as fs from "fs";
import Handlebars = require("handlebars");
import { Session } from "../../models/Session";
import { generateJwt } from "../../utils/auth";

const msInMinute = 1000 * 60;
const confirmTemplatePath = path.join(__dirname, "..", "..", "..", "..", "templates", "confirm.html");
const confirmTemplate = Handlebars.compile(fs.readFileSync(confirmTemplatePath, {
  encoding: "utf-8"
}));

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

export function registerAccount(role: AdminRole){
  return async function(r){
    const checkEmail = await checkExisting(r.payload.email)

    if(checkEmail){
      return error(Errors.AlreadyExist, "Account with this email already exist", {})
    }

    let admin = await Admin.create({
      firstName: r.payload.firstName,
      lastName: r.payload.lastName,
      email: r.payload.email,
      adminRole: role,
      password: r.payload.password,
    })
    const confirmEmail = getHexConfirmToken()

    const codeValidUntil = moment().add(config.auth.emailConfirmCodeLifetime, "ms").toISOString();
    await admin.update({
      "settings.confirmCode": confirmEmail,
      "settings.confirmCodeValidUntil": codeValidUntil
    });
    ////////////
    // const htmlEmail = confirmTemplate({
    //   confirmCode: confirmEmail.toUpperCase(),
    //   emailCodeLifetime: Math.floor(config.auth.emailConfirmCodeLifetime / msInMinute)
    // });
    // await addSendEmailJob({
    //   email: r.payload.email,
    //   subject: "[WorkQuest] Confirmation code",
    //   text: `Confirmation code: ${confirmEmail}.`,
    //   html: htmlEmail
    // });
    console.log(admin.id)
    const session = await Session.create({
      userId: admin.id
    });
    return output()
    // return output({ ...generateJwt({ id: session.id }), userStatus: admin.adminStatus });
  }
}