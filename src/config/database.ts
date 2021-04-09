import config from 'config';
import { ConnectionOptions, connect } from 'mongoose';

import Logger from './winston';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string = config.get('mongoURI');
    const options: ConnectionOptions = {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    };
    await connect(mongoURI, options);
    Logger.info('MongoDB Connected...');
  } catch (err) {
    Logger.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
