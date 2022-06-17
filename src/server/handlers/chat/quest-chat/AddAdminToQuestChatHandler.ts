import {QuestChatValidator} from './QuestChatValidator';
import {QuestChatAccessPermission} from './QuestChatAccessPermission';
import {BaseDomainHandler, HandlerDecoratorBase, IHandler} from '../../types';
import {AddDisputeAdminInQuestChatCommand, AddDisputeAdminInQuestChatResult} from "./types";
import {
  Chat,
  Admin,
  Message,
  ChatMember,
  MemberType,
  InfoMessage,
  MessageType,
  MemberStatus,
  MessageAction,
  ChatMemberData,
} from '@workquest/database-models/lib/models';


interface AddDisputeAdminInQuestChatPayload {
  readonly admin: Admin;
  readonly questChat: Chat;
  readonly lastMessage: Message;
}

interface RestoreAdminMemberPayload {
  readonly admin: Admin;
  readonly questChat: Chat;
  readonly lastMessage: Message;
  readonly adminDeletedMember: ChatMember;
}

interface SendInfoMessageAboutAddMemberPayload extends AddDisputeAdminInQuestChatPayload {
  readonly adminMember: ChatMember;
}

export class AddDisputeAdminInQuestChatHandler extends BaseDomainHandler<AddDisputeAdminInQuestChatCommand, AddDisputeAdminInQuestChatResult> {
  private getLastMessage(chat: Chat): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: this.options.tx,
    });
  }

  private async sendInfoMessageAboutAddMember(payload: SendInfoMessageAboutAddMemberPayload): Promise<[Message, InfoMessage]> {
    const message = await Message.create({
      type: MessageType.Info,
      chatId: payload.questChat.id,
      number: payload.lastMessage.number + 1,
      senderMemberId: payload.adminMember.id,
    }, { transaction: this.options.tx });

    const infoMessages = await InfoMessage.create({
      messageId: message.id,
      memberId: payload.adminMember.id,
      messageAction: MessageAction.QuestChatAddDisputeAdmin,
    }, { transaction: this.options.tx });

    return [message, infoMessages];
  }

  private async restoreAdminMember(payload: RestoreAdminMemberPayload): Promise<[ChatMember, ChatMemberData]> {
    const adminMember = await payload.adminDeletedMember.update({
      status: MemberStatus.Active,
    }, { transaction: this.options.tx });

    const chatMemberData = await ChatMemberData.create({
      chatId: payload.questChat.id,
      chatMemberId: adminMember.id,
      unreadCountMessages: 0,
      lastReadMessageId: payload.lastMessage.id,
      lastReadMessageNumber: payload.lastMessage.number,
    }, { transaction: this.options.tx });

    return [adminMember, chatMemberData];
  }

  private async createAdminMember(payload: AddDisputeAdminInQuestChatPayload): Promise<[ChatMember, ChatMemberData]> {
    const adminMember = await ChatMember.create({
        type: MemberType.Admin,
        chatId: payload.questChat.id,
        adminId: payload.admin.id,
        status: MemberStatus.Active,
      }, { transaction: this.options.tx });

    const chatMemberData = await ChatMemberData.create({
      chatId: payload.questChat.id,
      chatMemberId: adminMember.id,
      unreadCountMessages: 0,
      lastReadMessageId: payload.lastMessage.id,
      lastReadMessageNumber: payload.lastMessage.number,
    }, { transaction: this.options.tx });

    return [adminMember, chatMemberData];
  }

  public async Handle(command: AddDisputeAdminInQuestChatCommand): AddDisputeAdminInQuestChatResult {
    const lastMessage = await this.getLastMessage(command.questChat);

    const adminDeletedMember = await ChatMember.findOne({
      where: {
        adminId: command.admin.id,
        chatId: command.questChat.id,
        status: MemberStatus.Deleted,
      }
    });

    const [adminMember, ] =
      adminDeletedMember
        ? await this.restoreAdminMember({
            ...command,
            lastMessage,
            adminDeletedMember,
          })
        : await this.createAdminMember({
            ...command,
            lastMessage,
          })

    const messageAndInfoMessage = await this.sendInfoMessageAboutAddMember({
      ...command,
      lastMessage,
      adminMember,
    });

    return [adminMember, messageAndInfoMessage];
  }
}

export class AddDisputeAdminInQuestChatPreAccessPermissionHandler extends HandlerDecoratorBase<AddDisputeAdminInQuestChatCommand, AddDisputeAdminInQuestChatResult> {

  private readonly accessPermission: QuestChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<AddDisputeAdminInQuestChatCommand, AddDisputeAdminInQuestChatResult>,
  ) {
    super(decorated);

    this.accessPermission = new QuestChatAccessPermission();
  }

  public async Handle(command: AddDisputeAdminInQuestChatCommand): AddDisputeAdminInQuestChatResult {
    return this.decorated.Handle(command);
  }
}

export class AddDisputeAdminInQuestChatPreValidateHandler extends HandlerDecoratorBase<AddDisputeAdminInQuestChatCommand, AddDisputeAdminInQuestChatResult> {

  private readonly validator: QuestChatValidator;

  constructor(
    protected readonly decorated: IHandler<AddDisputeAdminInQuestChatCommand, AddDisputeAdminInQuestChatResult>,
  ) {
    super(decorated);

    this.validator = new QuestChatValidator();
  }

  public async Handle(command: AddDisputeAdminInQuestChatCommand): AddDisputeAdminInQuestChatResult {
    this.validator.QuestChatValidate(command.questChat);

    return this.decorated.Handle(command);
  }
}
