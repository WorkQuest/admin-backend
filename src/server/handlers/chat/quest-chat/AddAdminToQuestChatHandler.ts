import { QuestChatValidator } from './QuestChatValidator';
import {BaseDomainHandler, HandlerDecoratorBase, IHandler, Options} from '../../types';
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
  ChatMemberData, MessageType,
} from '@workquest/database-models/lib/models';

export interface AddDisputeAdminInQuestChatCommand {
  readonly questChat: Chat;
  readonly disputeAdmin: Admin;
}

interface AddDisputeAdminInQuestChatPayload {
  readonly questChat: Chat;
  readonly lastMessage: Message;
  readonly disputeAdminMember: ChatMember;
}

export class AddDisputeAdminInQuestChatHandler extends BaseDomainHandler<AddDisputeAdminInQuestChatCommand, Promise<Message>>{
  private async sendInfoMessageAboutAddMember(payload: AddDisputeAdminInQuestChatPayload): Promise<Message> {
    const message = await Message.create({
      type: MessageType.Info,
      chatId: payload.questChat.id,
      number: payload.lastMessage.number + 1, //'cause starts from 0
      senderMemberId: payload.disputeAdminMember.id,
    }, { transaction: this.options.tx });

    const infoMessages = await InfoMessage.create({
      messageId: message.id,
      memberId: payload.disputeAdminMember.id,
      messageAction: MessageAction.QuestChatAddDisputeAdmin,
    }, { transaction: this.options.tx })

    message.setDataValue('infoMessage', infoMessages);

    return message;
  }

  private getLastMessage(chat: Chat): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: this.options.tx,
    });
  }

  private async addAdminMemberAndCreateAdminData(payload: AddDisputeAdminInQuestChatPayload) {
    payload.disputeAdminMember.chatId = payload.questChat.id;
    payload.disputeAdminMember.status = MemberStatus.Active;

    await ChatMemberData.create({
      chatMemberId: payload.disputeAdminMember.id,
      chatId: payload.questChat.id,
      unreadCountMessages: 0,
      lastReadMessageId: payload.lastMessage.id,
      lastReadMessageNumber: payload.lastMessage.number,
    }, { transaction: this.options.tx });
  }

  public async Handle(command: AddDisputeAdminInQuestChatCommand): Promise<Message> {
    const disputeAdminMember = await ChatMember.create({
      chatId: command.questChat.id,
      adminId: command.disputeAdmin.id,
      type: MemberType.Admin,
    }, { transaction: this.options.tx });
    const lastMessage = await this.getLastMessage(command.questChat);

    await this.addAdminMemberAndCreateAdminData({ lastMessage, disputeAdminMember, questChat: command.questChat });

    return await this.sendInfoMessageAboutAddMember({
      questChat: command.questChat,
      disputeAdminMember,
      lastMessage,
    });
  }
}

export class AddDisputeAdminInQuestChatPreAccessPermissionHandler extends HandlerDecoratorBase<AddDisputeAdminInQuestChatCommand, Promise<Message>> {

  private readonly accessPermission: QuestChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<AddDisputeAdminInQuestChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.accessPermission = new QuestChatAccessPermission();
  }

  public async Handle(command: AddDisputeAdminInQuestChatCommand): Promise<Message> {
    const admin: Admin = command.disputeAdmin as Admin;

    await this.accessPermission.AdminIsNotMemberAccess(command.questChat, admin);

    return this.decorated.Handle(command);
  }
}

export class AddDisputeAdminInQuestChatPreValidateHandler extends HandlerDecoratorBase<AddDisputeAdminInQuestChatCommand, Promise<Message>> {

  private readonly validator: QuestChatValidator;

  constructor(
    protected readonly decorated: IHandler<AddDisputeAdminInQuestChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.validator = new QuestChatValidator();
  }

  public async Handle(command: AddDisputeAdminInQuestChatCommand): Promise<Message> {
    this.validator.QuestChatValidate(command.questChat);

    return this.decorated.Handle(command);
  }
}
