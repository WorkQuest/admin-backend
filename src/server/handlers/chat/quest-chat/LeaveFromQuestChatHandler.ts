import { QuestChatValidator } from './QuestChatValidator';
import { QuestChatAccessPermission } from './QuestChatAccessPermission';
import {LeaveFromQuestChatResult, LeaveFromQuestChatCommand} from "./types";
import {IHandler, HandlerDecoratorBase, BaseDomainHandler} from '../../types';
import {
  Chat,
  Message,
  InfoMessage,
  MessageType,
  MemberStatus,
  MessageAction,
  ChatMemberData,
  ChatMemberDeletionData,
  ReasonForRemovingFromChat,
} from '@workquest/database-models/lib/models';

interface LeaveMemberPayload extends LeaveFromQuestChatCommand {
  readonly lastMessage: Message;
}

export class LeaveFromQuestChatHandler extends BaseDomainHandler<LeaveFromQuestChatCommand, LeaveFromQuestChatResult> {
  private getLastMessage(chat: Chat): Promise<Message> {
    return Message.findOne({
      where: { chatId: chat.id },
      order: [['number', 'DESC']],
      lock: 'UPDATE' as any,
      transaction: this.options.tx,
    });
  }

  private async sendInfoMessageAboutLeaveMember(payload: LeaveMemberPayload): Promise<[Message, InfoMessage]> {
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
      message.save({ transaction: this.options.tx }),
      info.save({ transaction: this.options.tx }),
    ]);

    message.setDataValue('infoMessage', info);

    return [message, info];
  }

  private async leaveMember(payload: LeaveMemberPayload): Promise<[ChatMemberDeletionData]> {
    const [deletionData] = await Promise.all([
      ChatMemberDeletionData.create({
        chatMemberId: payload.member.id,
        reason: ReasonForRemovingFromChat.ResolvedDispute,
        beforeDeletionMessageId: payload.lastMessage.id,
        beforeDeletionMessageNumber: payload.lastMessage.number,
      }, { transaction: this.options.tx }),

      payload.member.update({
        status: MemberStatus.Deleted,
      }, { transaction: this.options.tx }),

      ChatMemberData.destroy({
        where: { chatMemberId: payload.member.id },
        transaction: this.options.tx,
      }),
    ]);

    return [deletionData];
  }

  public async Handle(command: LeaveFromQuestChatCommand): LeaveFromQuestChatResult {
    const lastMessage = await this.getLastMessage(command.questChat);

    const payload = { ...command, lastMessage };

    const [[message, infoMessage] ,] = await Promise.all([
      this.sendInfoMessageAboutLeaveMember(payload),
      this.leaveMember(payload),
    ]);

    return [message, infoMessage];
  }
}

export class LeaveFromQuestChatPreAccessPermissionHandler extends HandlerDecoratorBase<LeaveFromQuestChatCommand, LeaveFromQuestChatResult> {

  private readonly accessPermission: QuestChatAccessPermission;

  constructor(
    protected readonly decorated: IHandler<LeaveFromQuestChatCommand, LeaveFromQuestChatResult>,
  ) {
    super(decorated);

    this.accessPermission = new QuestChatAccessPermission();
  }

  public async Handle(command: LeaveFromQuestChatCommand): LeaveFromQuestChatResult {
    return this.decorated.Handle(command);
  }
}

export class LeaveFromQuestChatPreValidateHandler extends HandlerDecoratorBase<LeaveFromQuestChatCommand, LeaveFromQuestChatResult> {

  private readonly validator: QuestChatValidator;

  constructor(
    protected readonly decorated: IHandler<LeaveFromQuestChatCommand, LeaveFromQuestChatResult>,
  ) {
    super(decorated);

    this.validator = new QuestChatValidator();
  }

  public async Handle(command: LeaveFromQuestChatCommand): LeaveFromQuestChatResult {
    this.validator.QuestChatValidate(command.questChat);

    return this.decorated.Handle(command);
  }
}
