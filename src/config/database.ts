import config from 'config';
import { connect } from 'mongoose';

import Logger from './winston';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string = config.get('MONGO_URI');
    // const options: ConnectOptions = {
    //   useNewUrlParser: true,
    //   useCreateIndex: true,
    //   useFindAndModify: false,
    //   useUnifiedTopology: true
    // };
    // eslint-disable-next-line no-console
    connect(mongoURI);
    Logger.info('MongoDB Connected...');
  } catch (err) {
    Logger.error(err.message);
    // Exit process with failure
    //TO-DO - reconnect
    process.exit(1);
  }
};

export default connectDB;
