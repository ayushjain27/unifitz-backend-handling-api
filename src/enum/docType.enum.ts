export enum DocType {
  AADHAR = 'AADHAR',
  GST = 'GST',
  UDHYAM = 'UDHYAM'
}

export function isValidEmail(email: any) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
