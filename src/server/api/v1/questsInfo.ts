import {AdminRole, Quest} from "@workquest/database-models/lib/models";
import {error, output} from "../../utils";
import {Errors} from "../../utils/errors";

export async function getQuestsList(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);
  const {rows, count} = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, quests: rows });
}

export async function questInfo(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  const quest = await Quest.findByPk(r.params.questId);
  if(!quest) {
    error(Errors.NotFound, 'Quest not found',{});
  }

  return(quest);
}

export async function moderateQuest(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

}