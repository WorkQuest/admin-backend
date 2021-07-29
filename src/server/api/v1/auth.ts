import { Errors } from "../../utils/errors";
import { addSendEmailJob } from "../../jobs/sendEmail";
import config from "../../config/config";
import { output, error, getHexConfirmToken,validCaptcha } from "../../utils";
import { Admin, AdminRole, AdminStatus } from "../../models/Admin";
import * as moment from "moment";
import * as path from "path";
import * as fs from "fs";
import Handlebars = require("handlebars");
import { Session } from "../../models/Session";
import { generateJwt } from "../../utils/auth";
import { Op } from "sequelize";
const msInMinute = 1000 * 60;

Handlebars.registerHelper("pluralize", function(number, singular, plural) {
  if (number === 1)
    return singular;
  else
    return (typeof plural === "string" ? plural : singular + "s");
});
//TODO: change template for email!!!!
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
    console.log(role)

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
    const htmlEmail = confirmTemplate({
      confirmCode: confirmEmail.toUpperCase(),
      emailCodeLifetime: Math.floor(config.auth.emailConfirmCodeLifetime / msInMinute)
    });
    await addSendEmailJob({
      email: r.payload.email,
      subject: "[WorkQuest] Confirmation code",
      text: `Confirmation code: ${confirmEmail}.`,
      html: htmlEmail
    });
    const session = await Session.create({
      userId: admin.id
    });
    return output({ ...generateJwt({ id: session.id }), userStatus: admin.adminStatus });
  }
}

export async function login(r) {
  if (!await validCaptcha(r.payload.recaptcha))
    return error(Errors.InvalidCaptcha, 'Invalid captcha', {})
  const account = await Admin.scope("withPassword").findOne({
    where: {
      email: { [Op.iLike]: r.payload.email }
    }
  });

  if (!account)
    return error(Errors.NotFound, "Account not found", {});
  if (!await account.passwordCompare(r.payload.password))
    return error(Errors.NotFound, "Invalid password", {});

  const session = await Session.create({
    accountId: account.id
  });

  return output({ ...generateJwt({ id: session.id }), userStatus: account.adminStatus });
}

export async function confirmEmail(r) {
  let accountToConfirm = await Admin.scope("withPassword").findByPk(r.auth.credentials.id);
  if (accountToConfirm.settings.confirmCode !== r.payload.confirmCode)
    return error(Errors.InvalidPayload, "Invalid confirm code", [{ field: "confirmCode", reason: "invalid" }]);
  if (new Date(accountToConfirm.settings.confirmCodeValidUntil) < new Date())
    return error(Errors.EmailConfirmCodeExpired, "Confirm code expired", {})
  
  await accountToConfirm.update({
    "settings.confirmCode": null,
    "settings.confirmCodeValidUntil": null,
    adminStatus: AdminStatus.CONFIRMED
  });
  return output();
}