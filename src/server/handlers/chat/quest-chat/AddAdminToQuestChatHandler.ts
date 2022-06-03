import { QuestChatValidator } from './QuestChatValidator';
import { HandlerDecoratorBase, IHandler, Options } from '../../types';
import { QuestChatAccessPermission } from './QuestChatAccessPermission';
import {
  Chat,
  Admin,
  Message,
  ChatMember,
  MemberType,
  InfoMessage,
  MemberStatus,
  MessageAction,
  ChatMemberData,
} from '@workquest/database-models/lib/models';

export interface AddAdminInQuestChatCommand {
  readonly questChat: Chat;
  readonly admin: Admin;
}

interface AddAdminsInQuestChatPayload {
  readonly questChat: Chat;
  readonly disputeAdminMember: ChatMember;
  readonly lastMessage: Message;
}

export class AddAdminsInQuestChatHandler implements IHandler<AddAdminInQuestChatCommand, Promise<Message>>{
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static async sendInfoMessageAboutAddMember(payload: AddAdminsInQuestChatPayload, options: Options = {}): Promise<Message> {
    const message = await Message.create({
      type: MemberType.Admin,
      chatId: payload.questChat.id,
      number: payload.lastMessage.number + 1, //'cause starts from 0
      senderMemberId: payload.disputeAdminMember.id,
    }, { transaction: options.tx });

    const infoMessages = await InfoMessage.create({
      messageId: message.id,
      memberId: payload.disputeAdminMember.id,
      messageAction: MessageAction.QuestChatAddDisputeAdmin,
    }, { transaction: options.tx })

    message.setDataValue('infoMessage', infoMessages);

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

  private static async addAdminMemberAndCreateAdminData(payload: AddAdminsInQuestChatPayload, options: Options = {}) {
    payload.disputeAdminMember.chatId = payload.questChat.id;
    payload.disputeAdminMember.status = MemberStatus.Active;

    await ChatMemberData.create({
        chatMemberId: payload.disputeAdminMember.id,
        chatId: payload.questChat.id,
        unreadCountMessages: 0,
        lastReadMessageId: payload.lastMessage.id,
        lastReadMessageNumber: payload.lastMessage.number,
    }, { transaction: options.tx });
  }

  public async Handle(command: AddAdminInQuestChatCommand): Promise<Message> {
    return await this.dbContext.transaction(async (tx) => {
      const disputeAdminMember = await ChatMember.create({
        chatId: command.questChat.id,
        adminId: command.admin.id,
        type: MemberType.Admin,
      }, { transaction: tx });
      const lastMessage = await AddAdminsInQuestChatHandler.getLastMessage(command.questChat, { tx });

      await AddAdminsInQuestChatHandler.addAdminMemberAndCreateAdminData({ lastMessage, disputeAdminMember, questChat: command.questChat }, { tx });

      return await AddAdminsInQuestChatHandler.sendInfoMessageAboutAddMember({
        questChat: command.questChat,
        disputeAdminMember,
        lastMessage,
      }, { tx });
    });
  }
}

export class AddAdminsInQuestChatPreAccessPermissionHandler extends HandlerDecoratorBase<AddAdminInQuestChatCommand, Promise<Message>> {

  private readonly accessPermission: QuestChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<AddAdminInQuestChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.accessPermission = new QuestChatAccessPermission();
  }

  public async Handle(command: AddAdminInQuestChatCommand): Promise<Message> {
    const admin: Admin = command.admin as Admin;

    await this.accessPermission.AdminIsNotMemberAccess(command.questChat, admin);

    return this.decorated.Handle(command);
  }
}

export class AddAdminsInQuestChatPreValidateHandler extends HandlerDecoratorBase<AddAdminInQuestChatCommand, Promise<Message>> {

  private readonly validator: QuestChatValidator;

  constructor(
    protected readonly decorated: IHandler<AddAdminInQuestChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.validator = new QuestChatValidator();
  }

  public async Handle(command: AddAdminInQuestChatCommand): Promise<Message> {
    this.validator.QuestChatValidate(command.questChat);

    return this.decorated.Handle(command);
  }
}
