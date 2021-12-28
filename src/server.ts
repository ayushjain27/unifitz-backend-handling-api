import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import _ from 'lodash';
import connectDB from './config/database';
import { connectFirebaseAdmin } from './config/firebase-config';
import morganMiddleware from './config/morgan';
import Logger from './config/winston';
import Catalog, { ICatalog } from './models/Catalog';
import file from './routes/api/file';
import admin from './routes/api/admin';
import store from './routes/api/store';
import user from './routes/api/user';
import customer from './routes/api/customer';
import notification from './routes/api/notification';
import product from './routes/api/product';
import { ObjectId } from 'mongoose';

const app = express();
// Connect to MongoDB
connectDB();
// Connect with firebase admin
connectFirebaseAdmin();

app.use(cors());
app.set('port', process.env.PORT || 3005);
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
  res.send({ message: 'Server is started successfully' });
});

app.use(`/user`, user);
app.use(`/admin`, admin);

app.use('/store', store);

app.use('/file', file);

app.use('/customer', customer);

app.use('/notification', notification);
app.use('/product', product);
app.get('/category', async (req, res) => {
  const categoryList: ICatalog[] = await Catalog.find({ parent: 'root' });
  const result = categoryList
    .sort((a, b) =>
      a.displayOrder > b.displayOrder
        ? 1
        : b.displayOrder > a.displayOrder
        ? -1
        : 0
    )
    .map(({ _id, catalogName, catalogIcon }) => {
      return { _id, catalogName, catalogIcon };
    });

  // const result = categoryList.map(({ _id, catalogName, catalogIcon }) => {
  //   return { _id, catalogName, catalogIcon };
  // });
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

// TODO: Remove this api once app is launched to  production
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

app.post('/brand', async (req, res) => {
  const { subCategoryList, category } = req.body;
  let query = {};
  const treeVal: string[] = [];
  if (Array.isArray(subCategoryList)) {
    subCategoryList.forEach((subCat) => {
      treeVal.push(`root/${category}/${subCat}`);
    });
  } else {
    treeVal.push(`root/${category}/${subCategoryList}`);
  }
  query = { tree: { $in: treeVal } };
  const categoryList: ICatalog[] = await Catalog.find(query);
  let result = categoryList.map(({ _id, catalogName }) => {
    return { _id, catalogName };
  });
  result = _.uniqBy(result, (e: { catalogName: string; _id: ObjectId }) => {
    return e.catalogName;
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
