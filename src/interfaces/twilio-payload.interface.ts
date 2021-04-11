export interface TwilioVerifyPayload {
  phoneNumber: string;
  code: string;
}

export interface TwilioLoginPayload {
  phoneNumber: string;
  channel: string;
}
