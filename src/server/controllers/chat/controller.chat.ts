import {
  Chat,
  ChatData,
  ChatMember,
  ChatMemberData, ChatMemberDeletionData,
  ChatType,
  GroupChat, InfoMessage,
  MemberStatus,
  MemberType,
  Message, MessageAction, MessageType, QuestChat, QuestChatStatuses,
} from "@workquest/database-models/lib/models";
import { error } from "../../utils";
import { Errors } from "../../utils/errors";
import { Op, Transaction } from "sequelize";

abstract class ChatHelper {
  public abstract chat: Chat;

  static async chatMustExists(chatId: string) {
    if (!(await Chat.findByPk(chatId))) {
      throw error(Errors.NotFound, 'Chat does not exist', { chatId });
    }
  }

  public async chatMustHaveMember(adminId: string) {
    const member = await ChatMember.findOne({
      where: { chatId: this.chat.id, adminId },
    });

    if (!member) {
      throw error(Errors.Forbidden, 'Admin is not a member of this chat', {});
    }
  }

  public questChatMastHaveStatus(status: QuestChatStatuses): this {
    if (this.chat.questChat.status !== status) {
      throw error(Errors.Forbidden, 'Quest chat type does not match', {
        mastHave: status,
        current: this.chat.questChat.status,
      });
    }

    return this;
  }

  public chatMustHaveType(type: ChatType): this {
    if (this.chat.type !== type) {
      throw error(Errors.InvalidType, 'Type does not match', {});
    }

    return this;
  }

  public chatMustHaveOwner(memberId: string): this {
    if (this.chat.groupChat.ownerMemberId !== memberId) {
      throw error(Errors.Forbidden, 'Admin is not a owner in this chat', {});
    }

    return this;
  }

  public async adminsNotExistInGroupChat(adminIds: string[]): Promise<this> {
    const members = await ChatMember.unscoped().findAll({
      where: { adminId: adminIds, chatId: this.chat.id, status: MemberStatus.Active },
    });

    const membersIds = members.map(member => { return member.id });

    const membersData = await ChatMemberData.unscoped().findAll({
      where: { chatMemberId: membersIds },
    });

    if (membersData.length !== 0) {
      const existingMembers = members.filter((member) => (membersIds.findIndex((memberId) => member.id === memberId) !== -1));
      const existingAdminsIds = existingMembers.map(member => member.adminId);
      throw error(Errors.AlreadyExists, 'Admins already exists in group chat', { existingAdminsIds });
    }

    return this;
  }
}

export class ChatController extends ChatHelper {
  constructor(public chat: Chat) {
    super();

    if (!chat) {
      throw error(Errors.NotFound, 'Chat not found', {});
    }
  }

  static async createGroupChat(adminIds: string[], name, ownerAdminId, transaction?: Transaction): Promise<ChatController> {
    const chat = await Chat.create({ type: ChatType.group }, { transaction });
    const chatController = new ChatController(chat);
    const chatMembers = await chatController.createChatMembers(adminIds, chat.id, transaction);
    const ownerChatMember = chatMembers.find(member => member.adminId === ownerAdminId);
    await GroupChat.create({ name, ownerMemberId: ownerChatMember.id, chatId: chat.id }, { transaction });
    chat.setDataValue('members', chatMembers);
    return chatController;
  }

  static async createQuestChat(employerId, workerId, questId, responseId, transaction?: Transaction) {
    const chat = await Chat.create({ type: ChatType.quest }, { transaction });
    const chatController = new ChatController(chat);
    const chatMembers = await chatController.createChatMembers([employerId, workerId], chat.id, transaction);
    const employerMemberId = chatMembers.find(member => member.adminId === employerId).id;
    const workerMemberId = chatMembers.find(member => member.adminId === workerId).id;
    await QuestChat.create({ employerMemberId, workerMemberId, questId, responseId, chatId: chat.id }, { transaction });
    chat.setDataValue('members', chatMembers);
    return chatController;
  }

  static async findOrCreatePrivateChat(senderAdminId: string, recipientAdminId: string, transaction?: Transaction): Promise<{ controller: ChatController, isCreated: boolean }> {
    try {
      const [chat, isCreated] = await Chat.findOrCreate({
        where: { type: ChatType.private },
        include: [
          {
            model: ChatMember,
            as: 'firstMemberInPrivateChat',
            where: { adminId: senderAdminId },
            required: true,
            attributes: [],
          },
          {
            model: ChatMember,
            as: 'secondMemberInPrivateChat',
            where: { adminId: recipientAdminId },
            required: true,
            attributes: [],
          },
          {
            model: ChatMember,
            as: 'members'
          },
          {
            model: ChatMember,
            as: 'meMember',
            where: { adminId: senderAdminId }
          }
        ],
        defaults: {
          type: ChatType.private,
        },
        transaction,
      });
      const controller = new ChatController(chat);
      if (isCreated) {
        const chatMembers = await controller.createChatMembers([senderAdminId, recipientAdminId],chat.id, transaction)
        chat.setDataValue('members', chatMembers);
      }
      return {controller, isCreated};
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatMembers(adminIds: string[], chatId, transaction?: Transaction): Promise<ChatMember[]> {
    try {
      const members = await ChatMember.findAll({ where: { chatId } });
      const existingMembers = members.filter((member) => (adminIds.findIndex((adminId) => member.adminId === adminId) !== -1));
      const existingMembersIds = existingMembers.map(member => { return member.adminId });
      const newAdminsIds = [];
      adminIds.map(adminId => {if (!existingMembersIds.includes(adminId)) newAdminsIds.push(adminId) });
      const chatMembers = newAdminsIds.map((adminId) => {
        return {
          adminId,
          chatId,
          type: MemberType.Admin,
        };
      });

      await ChatMember.update({status: MemberStatus.Active}, { where: { adminId: existingMembersIds } });

      const newMembers = await ChatMember.bulkCreate(chatMembers, { transaction });
      existingMembers.push(...newMembers);
      return existingMembers;
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatMembersData(chatMembers: ChatMember[], senderMemberId: string, message: Message, transaction?: Transaction) {
    try {
      const membersIds = chatMembers.map(member => { return member.id });
      const chatMembersData = chatMembers.map(member => {
        return {
          chatMemberId: member.id,
          unreadCountMessages: member.adminId === senderMemberId ? 0 : 1,
          lastReadMessageId: member.adminId === senderMemberId ? message.id : null,
          lastReadMessageNumber: member.adminId === senderMemberId ? message.number : null,
        }
      });
      await ChatMemberData.bulkCreate(chatMembersData, { transaction });
      await ChatMemberDeletionData.destroy({ where: {chatMemberId: membersIds }, transaction });
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatData(chatId: string, messageId: string, transaction?: Transaction) {
    try {
      await ChatData.create({
        chatId: chatId,
        lastMessageId: messageId,
      }, { transaction });
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatMemberDeletionData(chatMemberId: string, beforeDeletionMessageId: string, beforeDeletionMessageNumber: number, transaction?: Transaction) {
    try {
      const [deletionData, isCreated] = await ChatMemberDeletionData.findOrCreate({
        where: { chatMemberId },
        defaults: { chatMemberId, beforeDeletionMessageId, beforeDeletionMessageNumber },
        transaction
      });

      if (!isCreated) {
        throw error(Errors.Forbidden, 'Admin already not a member of this chat', {});
      }

      await ChatMember.update({ status: MemberStatus.Deleted }, { where: {id: chatMemberId}, transaction},);

      await ChatMemberData.destroy({ where: {chatMemberId: chatMemberId }, transaction });

    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createMessage(chatId: string, senderMemberId: string, messageNumber: number, text: string, transaction?: Transaction): Promise<Message> {
    try {
      return Message.create(
        {
          senderMemberId,
          chatId,
          text,
          type: MessageType.message,
          number: messageNumber,
        },
        { transaction }
      );
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createInfoMessage(senderMemberId: string, chatId: string, messageNumber: number, doingActionMemberId: string, messageAction: MessageAction, transaction?: Transaction): Promise<Message> {
    try {
      const message = await Message.create(
        {
          senderMemberId,
          chatId: chatId,
          number: messageNumber,
          type: MessageType.info,
        },
        { transaction }
      );
      const infoMessage = await InfoMessage.create({ memberId: doingActionMemberId, messageId: message.id, messageAction },{ transaction } );
      message.setDataValue('infoMessage', infoMessage);
      return message;
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

}
