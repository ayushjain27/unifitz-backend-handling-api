export enum DocType {
  AADHAR = 'AADHAR',
  GST = 'GST',
  UDHYAM = 'UDHYAM'
}

export function isValidEmail(email: any) {
  console.log(email,"adkl")
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;

    // if (!email || !emailRegex.test(email)) {
    //     return 'Invalid email address';
    // }
  return emailRegex.test(email);
}
