import {AdminRole, Quest} from "@workquest/database-models/lib/models";
import {output} from "../../utils";


export async function getQuestsList(r){
  r.auth.credentials.MustHaveAdminRole(AdminRole.main);

  const {rows, count} = await Quest.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
  });
  return output({ count, quests: rows });
}