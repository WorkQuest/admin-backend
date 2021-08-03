import { output, error} from "../../utils";
import {Admin, Role} from "database-models/lib/models/Admin"
import { paginate } from "../../utils";
import { Errors } from "../../utils/errors";

//TODO здесь бд админа, нужно бд юзера, когда появится
export async function showUsersList(r) {
  if(r.auth.credentials.adminRole !== Role.main){
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }
  const users = await Admin.findAndCountAll({
    ...paginate(r),
    order: [['createdAt', 'DESC']]
  })
  return output({data: users.rows, count: users.count})
}

export async function showQuestsList(r) {
  if(r.auth.credentials.adminRole !== Role.main){
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }
  const users = await Admin.findAndCountAll({
    ...paginate(r),
    order: [['createdAt', 'DESC']]
  })
  return output({data: users.rows, count: users.count})
}


export async function isInBlackList(r) {
  if(r.auth.credentials.adminRole !== Role.main){
    return error(Errors.InvalidAdminType, 'Invalid admin type', {})
  }
  const users = await Admin.findAndCountAll({
    ...paginate(r),
    order: [['createdAt', 'DESC']]
  })
  return output({data: users.rows, count: users.count})
}
