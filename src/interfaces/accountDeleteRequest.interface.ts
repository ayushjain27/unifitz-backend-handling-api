export interface AccountDeleteRequest {
  phoneNumber: string;
  userRole: string;
  feedback: string[];
  comments?: string;
}
