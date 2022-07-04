import { error } from "../../../utils";
import { Errors } from "../../../utils/errors";
import {
  Chat,
  Admin,
  ChatMember,
  MemberStatus,
} from "@workquest/database-models/lib/models";

export class QuestChatAccessPermission {
  public async AdminIsNotMemberAccess(questChat: Chat, admin: Admin) {
    const activeMember = await ChatMember.findOne({
      where: {
        chatId: questChat.id,
        adminId: admin.id,
        status: MemberStatus.Active,
      }
    });

    if (activeMember) {
      throw error(Errors.AlreadyExists, "Admin already exists in the chat", {
        chatId: questChat.id,
        adminIds: admin.id
      });
    }
  }
}
