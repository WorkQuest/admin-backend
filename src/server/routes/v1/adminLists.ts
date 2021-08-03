//здесь будет список всех юзеров, чёрный список, списко квестов
import * as Joi from "joi";
import { showUsersList, showQuestsList } from "../../api/v1/adminLists"
import { adminRoleSchema, } from "database-models/lib/schemes/admin";
import { emailSchema, firstNameSchema, lastNameSchema, paginationFields, idSchema} from "database-models/lib/schemes/common";
import { outputPaginationSchema, outputOkSchema } from "../../schemes";

export const totpSchema = Joi.string().max(255).example('772670')

export const userInfoSchema = Joi.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  userId: idSchema,
  adminRole: adminRoleSchema,
})

export const questInfoSchema = Joi.object({
  
})

//TODO: ДОПОЛНИТЬ СХЕМУ ВЫВОДА ИНФЫ О ЮЗЕРАХ, СЕЙЧАС ЗДЕСЬ СХЕМА АДМИНА
export default[{
  method: "GET",
  path: "/v1/admin/usersList",
  handler: showUsersList,
  options: {
    id: "v1.admin.getUsersList",
    tags: ["api", "admin"],
    description: "Show a list of users",
    validate: {
      query: Joi.object({
        ...paginationFields
      }).label('PaginationFields')
    },
    response: {
      schema: outputPaginationSchema('transactionsList', userInfoSchema).label('GetListOfTrasactionsResponseSchema')
    }
  }
}, {
  method: "GET",
  path: "/v1/admin/questsList",
  handler: showQuestsList,
  options: {
    id: "v1.admin.getQuestsList",
    tags: ["api", "admin"],
    description: "Show a list of quests",
    validate: {
      query: Joi.object({
        ...paginationFields
      }).label('PaginationFields')
    },
    response: {
      schema: outputPaginationSchema('transactionsList', userInfoSchema).label('GetListOfTrasactionsResponseSchema')
    }
  }
}]
