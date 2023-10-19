export function appendCodeToPhone(phoneNumber: string) {
  return `+91${phoneNumber?.slice(-10)}`;
}
