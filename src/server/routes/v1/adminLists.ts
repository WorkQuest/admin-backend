//здесь будет список всех юзеров, чёрный список, списко квестов
import * as Joi from "joi";
import { showUsersList } from "../../api/v1/adminLists"
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

//TODO: ДОПОЛНИТЬ СХЕМУ ВЫВОДА ИНФЫ О ЮЗЕРАХ, СЕЙЧАС ЗДЕСЬ СХЕМА АДМИНА
export default[{
  method: "GET",
  path: "/v1/admin/usersList",
  handler: showUsersList,
  options: {
    id: "v1.admin.getUserList",
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
}]
