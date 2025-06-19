/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
import { inject, injectable } from 'inversify';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { TYPES } from '../config/inversify.types';
import { sqsConfig } from '../config/constants';

@injectable()
export class SQSService {
  private client: SQSClient;
  private readonly queueUrl: string = sqsConfig.QUEUE_URL;

  constructor(@inject(TYPES.SQSClient) client: SQSClient) {
    this.client = client;
  }

  async sendMessage(message: string): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: message
      });
      await this.client.send(command);
    } catch (err) {
      throw new Error('There is some problem with sending message');
    }
  }

  async createMessage(event: string, data: any): Promise<void> {
    const message = JSON.stringify({ event, data });
    await this.sendMessage(message);
  }
}
