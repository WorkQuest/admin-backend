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

  private createAdminMember(payload: AddDisputeAdminInQuestChatPayload): Promise<[ChatMember, ChatMemberData]> {
    return Promise.all([
      ChatMember.create({
        type: MemberType.Admin,
        chatId: payload.questChat.id,
        adminId: payload.admin.id,
        status: MemberStatus.Active,
      }, { transaction: this.options.tx }),
      ChatMemberData.create({
        chatId: payload.questChat.id,
        chatMemberId: payload.admin.id,
        unreadCountMessages: 0,
        lastReadMessageId: payload.lastMessage.id,
        lastReadMessageNumber: payload.lastMessage.number,
      }, { transaction: this.options.tx }),
    ]);
  }

  public async Handle(command: AddDisputeAdminInQuestChatCommand): AddDisputeAdminInQuestChatResult {
    const lastMessage = await this.getLastMessage(command.questChat);

    const [adminMember, ] = await this.createAdminMember({
      ...command,
      lastMessage,
    });

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
    const admin: Admin = command.admin as Admin;

    await this.accessPermission.AdminIsNotMemberAccess(command.questChat, admin);

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
