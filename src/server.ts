import express from 'express';
import helmet from 'helmet';

import connectDB from './config/database';
import user from './routes/api/user';
import admin from './routes/api/admin';
import store from './routes/api/store';
import morganMiddleware from './config/morgan';
import Logger from './config/winston';
import Catalog, { ICatalog } from './models/Catalog';

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
// @desc    Liveliness base API
// @access  Public
app.get('/', async (_req, res) => {
  res.send('ok');
});

app.get('/test', async (req, res) => {
  res.send({ message: 'Server is started successfully again' });
});

app.use(`/user`, user);
app.use(`/admin`, admin);

app.use('/store', store);

app.get('/category', async (req, res) => {
  const categoryList: ICatalog[] = await Catalog.find({ parent: 'root' });
  const result = categoryList.map(({ _id, catalogName }) => {
    return { _id, catalogName };
  });
  res.json({
    list: result
  });
});

app.get('/subCategory', async (req, res) => {
  const categoryList: ICatalog[] = await Catalog.find({
    tree: `root/${req.query.category}`
  });
  const result = categoryList.map(({ _id, catalogName }) => {
    return { _id, catalogName };
  });
  res.json({
    list: result
  });
});

app.get('/brand', async (req, res) => {
  const categoryList: ICatalog[] = await Catalog.find({
    tree: `root/${req.query.category}/${req.query.subCategory}`
  });
  const result = categoryList.map(({ _id, catalogName }) => {
    return { _id, catalogName };
  });
  res.json({
    list: result
  });
});

const port = app.get('port');
const server = app.listen(port, () =>
  Logger.debug(`Server started on port ${port}`)
);

export default server;
