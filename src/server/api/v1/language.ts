import { Language, Admin } from "@workquest/database-models/lib/models";
import { Errors } from "../../utils/errors";
import { error, output } from "../../utils";
import { Op } from "sequelize";

export async function addLanguage(r) {
  const admin = await Admin.findByPk(r.auth.credentials.id);

  if(!admin) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  let language = await Language.findOne({
    where: {
      adminId: admin.id,
      language: {
        [Op.iLike]: r.payload.language,
      }
    }
  });

  if(language) {
    return error(Errors.AlreadyExist, 'You already add this language', {});
  }

  language = await Language.create({
    adminId: r.auth.credentials.id,
    language: r.payload.language,
  });

  return output(language);
}

export async function removeLanguage(r) {
  const admin = await Admin.findByPk(r.auth.credentials.id);

  if(!admin) {
    return error(Errors.NotFound, 'User is not found', {});
  }

  const language = await Language.findByPk(r.params.languageId);

  if(!language) {
    return error(Errors.NotFound, 'Language is not found', {});
  }

  await language.destroy();

  return output();
}
