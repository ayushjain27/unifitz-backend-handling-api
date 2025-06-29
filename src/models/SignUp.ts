import { model, ObjectId, Schema, Types } from 'mongoose';

export interface ISignUp {
  email?: string;
  password?: string;
  role?: string;
  userName?: string
}

const signUpSchema: Schema = new Schema<ISignUp>(
  {
    email: {
      type: String
    },
    password: {
      type: String
    },
    role: {
      type: String
    },
    userName: {
      type: String
    },
  },
  { timestamps: true, strict: false }
);

const SignUp = model<ISignUp>('NewUser', signUpSchema);

export default SignUp;
