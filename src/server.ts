import express from 'express';
import helmet from 'helmet';

import connectDB from './config/database';
import user from './routes/api/user';
import admin from './routes/api/admin';
import store from './routes/api/store';
import morganMiddleware from './config/morgan';
import Logger from './config/winston';
import { roleAuth } from './middleware/rbac';
import { ACL } from './enum/rbac.enum';

const app = express();
// Connect to MongoDB
connectDB();

app.set('port', process.env.PORT || 8080);
// Middlewares configuration
app.use(helmet());
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

app.use(`/user`, user);
app.use(`/admin`, admin);
// test RBAC
app.use('/store', roleAuth(ACL.STORE_CREATE), store);
app.get('/category', (req, res) => {
  res.json({
    name: 'Two-Wheelers'
  });
});
app.get('/suCategory', (req, res) => {
  res.json({
    name: 'Tyres'
  });
});
app.get('/brand', (req, res) => {
  res.json({
    name: 'TVS'
  });
});
const port = app.get('port');
const server = app.listen(port, () =>
  Logger.debug(`Server started on port ${port}`)
);

export default server;
