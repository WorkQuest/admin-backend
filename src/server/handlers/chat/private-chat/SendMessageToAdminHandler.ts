import { IHandler, Options } from '../../types';
import {
  Chat,
  Admin,
  Media,
  Message,
  ChatType,
  ChatMember,
  MemberType,
  MessageType,
  MemberStatus,
  ChatMemberData,
} from '@workquest/database-models/lib/models';

export interface SendMessageToAdminCommand {
  readonly text: string;
  readonly sender: Admin;
  readonly recipient: Admin;
  readonly medias: ReadonlyArray<Media>;
}

export interface FindOrCreatePrivateAdminChatPayload extends SendMessageToAdminCommand {

}

export interface AddP2PMembersPayload extends SendMessageToAdminCommand {
  readonly privateChat: Chat;
}

export interface SendMessageToMemberPayload {
  readonly text: string;
  readonly privateChat: Chat;
  readonly sender: ChatMember;
  readonly recipient: ChatMember;
  readonly lastMessage?: Message;
  readonly medias: ReadonlyArray<Media>;
}

export class SendMessageToAdminHandler implements IHandler<SendMessageToAdminCommand, Promise<Message>> {
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static async addP2PMembers(payload: AddP2PMembersPayload, options: Options = {}): Promise<[sender: ChatMember, recipient: ChatMember]> {
    const sender = ChatMember.build({
      chatId: payload.privateChat.id,
      adminId: payload.sender.id,
      type: MemberType.Admin,
      status: MemberStatus.Active,
    });
    const recipient = ChatMember.build({
      chatId: payload.privateChat.id,
      adminId: payload.recipient.id,
      type: MemberType.Admin,
      status: MemberStatus.Active,
    });

    const membersData = ChatMemberData.bulkBuild([{
      chatMemberId: sender.id,
      chatId: payload.privateChat.id,
      unreadCountMessages: 0,
      lastReadMessageId: null,
      lastReadMessageNumber: null,
    }, {
      chatMemberId: recipient.id,
      chatId: payload.privateChat.id,
      unreadCountMessages: 1,
      lastReadMessageId: null,
      lastReadMessageNumber: null,
    }]);

    await Promise.all([
      sender.save({ transaction: options.tx }),
      recipient.save({ transaction: options.tx }),
    ]);
    await Promise.all(
      membersData.map(async member => member.save({ transaction: options.tx }))
    );

    return [sender, recipient];
  }

  private static async sendMessage(payload: SendMessageToMemberPayload, options: Options = {}) {
    let lastMessageNumber = 1;
    if (payload.lastMessage) {
      lastMessageNumber += payload.lastMessage.number
    }
    const message = await Message.create({
      chatId: payload.privateChat.id,
      number: lastMessageNumber,
      senderMemberId: payload.sender.id,
      type: MessageType.Message,
      text: payload.text,
    }, { transaction: options.tx });

    await message.$set('medias', payload.medias as Media[], { transaction: options.tx });
    message.setDataValue('chat', payload.privateChat);
    return message;
  }

  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  public static findOrCreatePrivateChat(payload: FindOrCreatePrivateAdminChatPayload, options: Options = {}): Promise<[chat: Chat, isCreated: boolean]> {
    return Chat.scope('privateChat').findOrCreate({
      where: { type: ChatType.Private },
      defaults: { type: ChatType.Private },
      transaction: options.tx,
      include: [{
        model: ChatMember,
        as: 'senderInPrivateChat',
        where: { adminId: payload.sender.id },
        required: true,
      }, {
        model: ChatMember,
        as: 'recipientInPrivateChat',
        where: { adminId: payload.recipient.id },
        required: true,
      }],
    });
  }

  public async Handle(command: SendMessageToAdminCommand): Promise<Message> {
    return await this.dbContext.transaction(async (tx) => {
      const [privateChat, isCreated] = await SendMessageToAdminHandler.findOrCreatePrivateChat({ ...command }, { tx });

      if (isCreated) {
        const [sender, recipient] = await SendMessageToAdminHandler.addP2PMembers({ ...command, privateChat }, { tx });

        const payload: SendMessageToMemberPayload = { ...command, sender, recipient, privateChat }

        return SendMessageToAdminHandler.sendMessage(payload, { tx });
      } else {
        const lastMessage = await SendMessageToAdminHandler.getLastMessage(privateChat, { tx });

        const payload: SendMessageToMemberPayload = {
          ...command,
          lastMessage,
          privateChat,
          sender: privateChat.senderInPrivateChat,
          recipient: privateChat.recipientInPrivateChat,
        }

        return SendMessageToAdminHandler.sendMessage(payload, { tx });
      }
    });
  }
}
