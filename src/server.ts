import express from 'express';

import connectDB from './config/database';
import auth from './routes/api/auth';
import user from './routes/api/user';
import morganMiddleware from './config/morgan';
import Logger from './config/winston';

const app = express();

// Connect to MongoDB
connectDB();

app.set('port', process.env.PORT || 5000);
// Middlewares configuration
app.use(express.json());
app.use(express.urlencoded());
app.use(morganMiddleware);
// @route   GET /
// @desc    Test Base API
// @access  Public
app.get('/', (_req, res) => {
  res.send('API Running');
});

app.get('/logger', (_, res) => {
  Logger.error('This is an error log');
  Logger.warn('This is a warn log');
  Logger.info('This is a info log');
  Logger.http('This is a http log');
  Logger.debug('This is a debug log');

  res.send('Hello world');
});

app.use('/api/auth', auth);
app.use('/api/user', user);

const port = app.get('port');
const server = app.listen(port, () =>
  Logger.debug(`Server started on port ${port}`)
);

export default server;
