import {
  Chat,
  ChatData,
  ChatMember,
  ChatMemberData, ChatMemberDeletionData,
  ChatType,
  GroupChat, InfoMessage,
  MemberStatus,
  MemberType,
  Message, MessageAction, MessageType, QuestChat,
} from "@workquest/database-models/lib/models";
import { error } from "../utils";
import { Errors } from "../utils/errors";
import { Op, Transaction } from "sequelize";

abstract class ChatHelper {
  public abstract chat: Chat;

  static async chatMustExists(chatId: string) {
    if (!(await Chat.findByPk(chatId))) {
      throw error(Errors.NotFound, 'Chat does not exist', { chatId });
    }
  }
}

export class ChatController extends ChatHelper {
  constructor(public chat: Chat) {
    super();

    if (!chat) {
      throw error(Errors.NotFound, 'Chat not found', {});
    }
  }

  static async createGroupChat(userIds: string[], name, ownerUserId, transaction?: Transaction): Promise<ChatController> {
    const chat = await Chat.create({ type: ChatType.group }, { transaction });
    const chatController = new ChatController(chat);
    const chatMembers = await chatController.createChatMembers(userIds, chat.id, transaction);
    const ownerChatMember = chatMembers.find(member => member.userId === ownerUserId);
    await GroupChat.create({ name, ownerMemberId: ownerChatMember.id, chatId: chat.id }, { transaction });
    chat.setDataValue('members', chatMembers);
    return chatController;
  }

  static async createQuestChat(employerId, workerId, questId, responseId, transaction?: Transaction) {
    const chat = await Chat.create({ type: ChatType.quest }, { transaction });
    const chatController = new ChatController(chat);
    const chatMembers = await chatController.createChatMembers([employerId, workerId], chat.id, transaction);
    const employerMemberId = chatMembers.find(member => member.userId === employerId).id;
    const workerMemberId = chatMembers.find(member => member.userId === workerId).id;
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
      const chatMembers = adminIds.map((adminId) => {
        return {
          adminId,
          chatId,
          type: MemberType.Admin,
        };
      });
      return ChatMember.bulkCreate(chatMembers, { transaction });
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  public async createChatMembersData(chatMembers: ChatMember[], senderMemberId: string, message: Message, transaction?: Transaction) {
    try {
      const chatMembersIds = chatMembers.map(member => { return member.id });
      await ChatMemberDeletionData.destroy({ where: { id: { [Op.in]: chatMembersIds } } });
      const chatMembersData = chatMembers.map(member => {
        return {
          chatMemberId: member.id,
          unreadCountMessages: member.adminId === senderMemberId ? 0 : 1,
          lastReadMessageId: member.adminId === senderMemberId ? message.id : null,
          lastReadMessageNumber: member.adminId === senderMemberId ? message.number : null,
        }
      });
      await ChatMemberData.bulkCreate(chatMembersData, { transaction });
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
        throw error(Errors.Forbidden, 'User already not a member of this chat', {});
      }

      await ChatMember.update({ status: MemberStatus.Deleted }, { where: {id: chatMemberId} });

      await ChatMemberData.destroy({ where: {chatMemberId: chatMemberId } });

      await this.chat.getDataValue('meMember').chatMemberData.destroy();

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

  public async updateChatData(chatId: string, lastMessageId: string, transaction?: Transaction) {
    try {
      await ChatData.update({ lastMessageId }, { where: { chatId }, transaction });
    } catch (error) {
      if(transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

}
