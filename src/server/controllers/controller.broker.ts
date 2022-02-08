import * as amqp from 'amqplib/callback_api';
import config from "../config/config";
import { Buffer } from "buffer";

export const enum AdminBrokerQueues {
  Quest = 'quest'
}

export const enum QuestNotificationActions {
  DisputeDecision = 'disputeDecision'
}

type Notification<Action> = {
  action: Action;
  data: any;
  recipients: string[];
  delay?: number;
};

export class ControllerBroker {
  private channel;

  constructor() {
    this.initMessageBroker();
  }

  private initMessageBroker() {
    amqp.connect(config.notificationMessageBroker.link, (connectError, conn) => {
      if (connectError) {
        console.error(connectError.message);
        return;
      }

      conn.on('error', (connectionError) => {
        console.error(connectionError.message);
      });

      conn.on('close', () => {
        setTimeout(() => {
          this.initMessageBroker();
        }, 5000);
      });

      conn.createChannel((channelError, channel) => {
        if (channelError) {
          console.error(channelError.message);
        }

        this.channel = channel;
      });

      console.log('Message broker connected');
    });
  }

  public static convertData(data: object) {
    const stringData = JSON.stringify(data);

    return Buffer.from(stringData);
  }

  public sendQuestNotification(notification: Notification<QuestNotificationActions>) {
    if (!this.channel) return;

    const convertedData = ControllerBroker.convertData(notification);

    this.channel.sendToQueue(AdminBrokerQueues.Quest, convertedData);
  }
}
