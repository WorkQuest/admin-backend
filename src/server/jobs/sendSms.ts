import { Twilio } from 'twilio';
import { addJob } from '../utils/scheduler';
import config from '../config/config';

const client = new Twilio(config.twilio.accountSid, config.twilio.authToken);

export interface SmsPayload {
  toPhoneNumber: string;
  message: string;
}

export async function addSendSmsJob(payload: SmsPayload) {
  return addJob('sendSms', payload);
}

export default async function (payload: SmsPayload) {
  await client.api.messages.create({
    body: payload.message,
    to: payload.toPhoneNumber,
    from: config.twilio.phoneNumberSender,
  });
}
