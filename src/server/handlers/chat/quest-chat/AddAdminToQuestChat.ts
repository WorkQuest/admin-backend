import { GroupChatValidator } from './GroupChatValidator';
import { HandlerDecoratorBase, IHandler, Options } from '../../types';
import { GroupChatAccessPermission } from './GroupChatAccessPermission';
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
  ChatMemberDeletionData,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';

export interface AddAdminInQuestChatCommand {
  readonly questChat: Chat;
  readonly disputeAdmin: Admin;
}

interface AddAdminsPayload {
  readonly groupChat: Chat;
  readonly lastMessage: Message;
}

export class AddAdminsInGroupChatHandler implements IHandler<AddAdminInQuestChatCommand, Promise<Message[]>>{
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static async sendInfoMessageAboutAddMember(payload: AddAdminsPayload, options: Options = {}): Promise<Message[]> {
    const messages = Message.bulkBuild(
      payload.newMembers.map((member, number) => ({
        type: MemberType.Admin,
        chatId: payload.groupChat.id,
        number: payload.lastMessage.number + number + 1, //'cause starts from 0
        senderMemberId: payload.groupChat.groupChat.ownerMemberId,
      }))
    );
    const infoMessages = InfoMessage.bulkBuild(
      messages.map((message, number) => ({
        messageId: message.id,
        memberId: payload.newMembers[number].id,
        messageAction: MessageAction.GroupChatAddMember,
      }))
    )

    await Promise.all(
      messages.map(async message => message.save({ transaction: options.tx })),
    );
    await Promise.all(
      infoMessages.map(async infoMessage => infoMessage.save({ transaction: options.tx })),
    );

    messages.forEach((message, number) => {
      message.setDataValue('infoMessage', infoMessages[number]);
    });

    return messages;
  }

  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async addMembers(payload: AddAdminsPayload, options: Options = {}) {
    payload.newMembers.forEach(member => {
      member.chatId = payload.groupChat.id;
      member.status = MemberStatus.Active;
    });

    const membersData = ChatMemberData.bulkBuild(
      payload.newMembers.map(member => ({
        chatMemberId: member.id,
        chatId: payload.groupChat.id,
        unreadCountMessages: 0,
        lastReadMessageId: payload.lastMessage.id,
        lastReadMessageNumber: payload.lastMessage.number,
      }))
    );

    await Promise.all(
      payload.newMembers.map(async member => member.save({ transaction: options.tx }))
    );
    await Promise.all(
      membersData.map(async member => member.save({ transaction: options.tx }))
    );
  }

  public async Handle(command: AddAdminInQuestChatCommand): Promise<Message[]> {
    const newMembers = ChatMember.build({
      chatId: command.questChat.id,
      adminId: command.disputeAdmin.id,
      type: MemberType.Admin,
    });

    return await this.dbContext.transaction(async (tx) => {
      const lastMessage = await AddAdminsInGroupChatHandler.getLastMessage(command.groupChat, { tx });

      await Promise.all([
        AddAdminsInGroupChatHandler.addMembers({ lastMessage, newMembers, groupChat: command.groupChat }, { tx }),
      ]);

      let messages = [];

      if (newMembers.length !== 0) {
        const messagesWithInfoAddAdmin = await AddAdminsInGroupChatHandler.sendInfoMessageAboutAddMember({
          admin,
          groupChat: command.groupChat,
          lastMessage,
        }, { tx });
      }

      return messagesWithInfoAddAdmin;
    });
  }
}

export class AddAdminsInGroupChatPreAccessPermissionHandler extends HandlerDecoratorBase<AddAdminsInGroupChatCommand, Promise<Message[]>> {

  private readonly accessPermission: GroupChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<AddAdminsInGroupChatCommand, Promise<Message[]>>,
  ) {
    super(decorated);

    this.accessPermission = new GroupChatAccessPermission();
  }

  public async Handle(command: AddAdminsInGroupChatCommand): Promise<Message[]> {
    const admins: Admin[] =  command.admins as Admin[];

    await this.accessPermission.AdminIsNotMemberAccess(command.groupChat, admins);
    await this.accessPermission.AdminIsNotLeftAccess(command.groupChat, admins);

    this.accessPermission.MemberHasAccess(command.groupChat, command.addInitiator);
    this.accessPermission.MemberHasOwnerAccess(command.groupChat, command.addInitiator);

    return this.decorated.Handle(command);
  }
}

export class AddAdminsInGroupChatPreValidateHandler extends HandlerDecoratorBase<AddAdminsInGroupChatCommand, Promise<Message[]>> {

  private readonly validator: GroupChatValidator;

  constructor(
    protected readonly decorated: IHandler<AddAdminsInGroupChatCommand, Promise<Message[]>>,
  ) {
    super(decorated);

    this.validator = new GroupChatValidator();
  }

  public async Handle(command: AddAdminsInGroupChatCommand): Promise<Message[]> {
    this.validator.GroupChatValidate(command.groupChat);

    return this.decorated.Handle(command);
  }
}
