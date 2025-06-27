import config from 'config';
import mongoose, { connect } from 'mongoose';

import Logger from './winston';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string = "mongodb+srv://ayushjain201574:3pDgXUtWqGw8eoNq@cluster0.pbg1y4t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    // const options: ConnectOptions = {
    //   useNewUrlParser: true,
    //   useCreateIndex: true,
    //   useFindAndModify: false,
    //   useUnifiedTopology: true
    // };
    // eslint-disable-next-line no-console
    connect(mongoURI, { maxPoolSize: 25 });
    mongoose.connection.on('error', (err) => {
      throw new Error(`unable to connect to database: mongodb+srv://ayushjain201574:3pDgXUtWqGw8eoNq@cluster0.pbg1y4t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
    });

    mongoose.connection.on('connected', () => {
      Logger.info('MongoDB Connected...');
    });
  } catch (err) {
    Logger.error(err.message);
    // Exit process with failure
    //TO-DO - reconnect
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  mongoose.connection
    .close()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      process.exit(1); // Exit with an error code
    });
});

process.on('SIGTERM', () => {
  mongoose.connection
    .close()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      process.exit(1); // Exit with an error code
    });
});

connectDB();
