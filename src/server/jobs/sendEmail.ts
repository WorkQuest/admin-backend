import { addJob } from "../utils/scheduler";

// TODO use templates and data
export interface SendEmailPayload {
  email: string,
  text: string,
  subject: string;
  html: string;
}

export async function addSendEmailJob(payload: SendEmailPayload) {
  return addJob("sendEmail", payload);
}
