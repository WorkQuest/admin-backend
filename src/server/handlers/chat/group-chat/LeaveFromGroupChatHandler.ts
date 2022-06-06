import { GroupChatValidator } from './GroupChatValidator';
import { Options, IHandler, HandlerDecoratorBase } from '../../types';
import { GroupChatAccessPermission } from './GroupChatAccessPermission';
import {
  Chat,
  Message,
  ChatMember,
  InfoMessage,
  MessageType,
  MemberStatus,
  MessageAction,
  ChatMemberData,
  ChatMemberDeletionData,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';

export interface LeaveFromGroupChatCommand {
  readonly member: ChatMember;
  readonly groupChat: Chat;
}

interface LeaveMemberPayload extends LeaveFromGroupChatCommand {
  readonly lastMessage: Message;
}

export class LeaveFromGroupChatHandler implements IHandler<LeaveFromGroupChatCommand, Promise<Message>> {
  constructor(
    private readonly dbContext: any,
  ) {
  }

  private static getLastMessage(chat: Chat, options: Options = {}): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: options.tx,
    });
  }

  private static async sendInfoMessageAboutLeaveMember(payload: LeaveMemberPayload, options: Options = {}): Promise<Message> {
    const message = Message.build({
      number: payload.lastMessage.number + 1,
      chatId: payload.groupChat.id,
      senderMemberId: payload.member.id,
      type: MessageType.Info,
    });
    const info = InfoMessage.build({
      messageId: message.id,
      memberId: payload.member.id,
      messageAction: MessageAction.GroupChatLeaveMember,
    });

    await Promise.all([
      message.save({ transaction: options.tx }),
      info.save({ transaction: options.tx }),
    ]);

    message.setDataValue('infoMessage', info);

    return message;
  }

  private static async leaveMember(payload: LeaveMemberPayload, options: Options = {}): Promise<[ChatMemberDeletionData]> {
    const [deletionData] = await Promise.all([
      ChatMemberDeletionData.create({
        chatMemberId: payload.member.id,
        reason: ReasonForRemovingFromChat.Left,
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      }, { transaction: options.tx, }),

      payload.member.update({
        status: MemberStatus.Deleted,
      }, { transaction: options.tx }),

      ChatMemberData.destroy({
        where: { chatMemberId: payload.member.id },
        transaction: options.tx,
      }),
    ]);

    return [deletionData];
  }

  public async Handle(command: LeaveFromGroupChatCommand): Promise<Message> {
    const [[deletionData], messageWithInfo] = await this.dbContext.transaction(async (tx) => {
      const lastMessage = await LeaveFromGroupChatHandler.getLastMessage(command.groupChat, { tx });

      const payload = { ...command, lastMessage };

      return Promise.all([
        LeaveFromGroupChatHandler.leaveMember(payload, { tx }),
        LeaveFromGroupChatHandler.sendInfoMessageAboutLeaveMember(payload, { tx }),
      ]);
    });

    return messageWithInfo;
  }
}

export class LeaveFromGroupChatPreAccessPermissionHandler extends HandlerDecoratorBase<LeaveFromGroupChatCommand, Promise<Message>> {

  private readonly accessPermission: GroupChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<LeaveFromGroupChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.accessPermission = new GroupChatAccessPermission();
  }

  public async Handle(command: LeaveFromGroupChatCommand): Promise<Message> {
    this.accessPermission.MemberHasAccess(command.groupChat, command.member);

    return this.decorated.Handle(command);
  }
}

export class LeaveFromGroupChatPreValidateHandler extends HandlerDecoratorBase<LeaveFromGroupChatCommand, Promise<Message>> {

  private readonly validator: GroupChatValidator;

  constructor(
    protected readonly decorated: IHandler<LeaveFromGroupChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.validator = new GroupChatValidator();
  }

  public async Handle(command: LeaveFromGroupChatCommand): Promise<Message> {
    this.validator.GroupChatValidate(command.groupChat);
    this.validator.NotChatOwnerValidate(command.groupChat, command.member);

    return this.decorated.Handle(command);
  }
}
