import { QuestChatValidator } from './QuestChatValidator';
import { Options, IHandler, HandlerDecoratorBase } from '../../types';
import { QuestChatAccessPermission } from './QuestChatAccessPermission';
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

export interface LeaveFromQuestChatCommand {
  readonly member: ChatMember;
  readonly questChat: Chat;
}

interface LeaveMemberPayload extends LeaveFromQuestChatCommand {
  readonly lastMessage: Message;
}

export class LeaveFromQuestChatHandler implements IHandler<LeaveFromQuestChatCommand, Promise<Message>> {
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
      chatId: payload.questChat.id,
      senderMemberId: payload.member.id,
      type: MessageType.Info,
    });
    const info = InfoMessage.build({
      messageId: message.id,
      memberId: payload.member.id,
      messageAction: MessageAction.QuestChatLeaveDisputeAdmin,
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
        reason: ReasonForRemovingFromChat.ResolvedDispute,
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

  public async Handle(command: LeaveFromQuestChatCommand): Promise<Message> {
    const [[deletionData], messageWithInfo] = await this.dbContext.transaction(async (tx) => {
      const lastMessage = await LeaveFromQuestChatHandler.getLastMessage(command.questChat, { tx });

      const payload = { ...command, lastMessage };

      return Promise.all([
        LeaveFromQuestChatHandler.leaveMember(payload, { tx }),
        LeaveFromQuestChatHandler.sendInfoMessageAboutLeaveMember(payload, { tx }),
      ]);
    });

    return messageWithInfo;
  }
}

export class LeaveFromQuestChatPreAccessPermissionHandler extends HandlerDecoratorBase<LeaveFromQuestChatCommand, Promise<Message>> {

  private readonly accessPermission: QuestChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<LeaveFromQuestChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.accessPermission = new QuestChatAccessPermission();
  }

  public async Handle(command: LeaveFromQuestChatCommand): Promise<Message> {
    return this.decorated.Handle(command);
  }
}

export class LeaveFromQuestChatPreValidateHandler extends HandlerDecoratorBase<LeaveFromQuestChatCommand, Promise<Message>> {

  private readonly validator: QuestChatValidator;

  constructor(
    protected readonly decorated: IHandler<LeaveFromQuestChatCommand, Promise<Message>>,
  ) {
    super(decorated);

    this.validator = new QuestChatValidator();
  }

  public async Handle(command: LeaveFromQuestChatCommand): Promise<Message> {
    this.validator.QuestChatValidate(command.questChat);

    return this.decorated.Handle(command);
  }
}
