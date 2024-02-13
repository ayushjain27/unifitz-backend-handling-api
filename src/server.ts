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
import category from './routes/api/category.route';
import admin from './routes/api/admin';
import event from './routes/api/event.route';
import offer from './routes/api/offer';
import store from './routes/api/store';
import user from './routes/api/user';
import customer from './routes/api/customer';
import notification from './routes/api/notification';
import analytic from './routes/api/analytic.route';
import product from './routes/api/product';
import employee from './routes/api/employee';
import jobCard from './routes/api/jobCard.route';
import advertisement from './routes/api/advertisement.route';
import favouriteStore from './routes/api/favouriteStore';
// import { ObjectId } from 'mongoose';
import vehicle from './routes/api/vehicle';
import enquiry from './routes/api/enquiry.route';
import buysell from './routes/api/buySell.route';
import { window } from './utils/constants/common';
import stateCityList from './utils/constants/statecityList.json';
import questions from './utils/constants/reportQuestions.json';
import report from './routes/api/report';
import AWS from 'aws-sdk';
import { s3Config } from './config/constants';

const app = express();
// Connect to MongoDB

AWS.config.update({
  accessKeyId: s3Config.AWS_KEY_ID,
  secretAccessKey: s3Config.ACCESS_KEY,
  region: 'ap-southeast-2'
});

connectDB();
// Connect with firebase admin
connectFirebaseAdmin();

app.use(cors());
app.set('port', process.env.PORT || 3005);
// Middlewares configuration
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.use('/buysell', buysell);

app.use('/notification', notification);
app.use('/product', product);
app.use('/employee', employee);
app.use('/analytic', analytic);
app.use('/job-card', jobCard);
app.use('/media', advertisement);
app.use('/favourite', favouriteStore);
app.use('/vehicle', vehicle);
app.use('/enquiry', enquiry);
app.use('/categories', category);
app.use('/report', report);
app.use(`/event`, event);
app.use(`/offer`, offer);
app.get('/category', async (req, res) => {
  const catalogType = req.query.catalogType || 'category';
  const categoryList: ICatalog[] = await Catalog.find({
    parent: 'root',
    catalogType
  });
  const result = categoryList
    .sort((a, b) =>
      a.displayOrder > b.displayOrder
        ? 1
        : b.displayOrder > a.displayOrder
        ? -1
        : 0
    )
    .map(
      ({
        _id,
        catalogName,
        tree,
        parent,
        catalogType,
        catalogIcon,
        catalogWebIcon
      }) => {
        return {
          _id,
          catalogName,
          tree,
          parent,
          catalogType,
          catalogIcon,
          catalogWebIcon
        };
      }
    );
  res.json({
    list: result
  });
});

// TODO: Remove this API once app is launced to new v2
app.get('/subCategory', async (req, res) => {
  const catalogType = req.query.catalogType || 'subCategory';

  const categoryList: ICatalog[] = await Catalog.find({
    tree: `root/${req.query.category}`,
    catalogType
  });
  const result = categoryList.map(({ _id, catalogName }) => {
    return { _id, catalogName };
  });
  res.json({
    list: result
  });
});

app.post('/subCategory', async (req, res) => {
  const { categoryList } = req.body;
  const catalogType = req.body.catalogType || 'subCategory';
  let query = {};
  const treeVal: string[] = [];
  if (Array.isArray(categoryList)) {
    categoryList.forEach((category) => {
      treeVal.push(`root/${category.catalogName}`);
    });
  } else {
    treeVal.push(`root/${categoryList}`);
  }
  query = { tree: { $in: treeVal }, catalogType };
  const subCatList: ICatalog[] = await Catalog.find(query);
  let result = subCatList.map(
    ({ _id, catalogName, tree, parent, catalogType }) => {
      return { _id, catalogName, tree, parent, catalogType };
    }
  );
  result = _.uniqBy(result, (e: ICatalog) => {
    return e.catalogName;
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
  // const result = categoryList.map(({ _id, catalogName }) => {
  //   return { _id, catalogName };
  // });
  res.json({
    list: categoryList
  });
});

app.post('/brand', async (req, res) => {
  const { subCategoryList, category } = req.body;
  let query = {};
  const treeVal: string[] = [];
  if (Array.isArray(subCategoryList)) {
    subCategoryList.forEach((subCat) => {
      if (subCat?.tree) {
        treeVal.push(`${subCat.tree}/${subCat.catalogName}`);
      } else {
        treeVal.push(`root/${category}/${subCat}`);
      }
    });
  }
  query = { tree: { $in: treeVal } };
  const categoryList: ICatalog[] = await Catalog.find(query);
  let result = categoryList.map(
    ({ _id, catalogName, tree, parent, catalogType }) => {
      return { _id, catalogName, tree, parent, catalogType };
    }
  );
  result = _.uniqBy(result, (e: ICatalog) => {
    return e.catalogName;
  });
  res.json({
    list: result
  });
});

app.get('/stateCityList', async (req, res) => {
  res.json(stateCityList);
});

app.get('/reportQuestions', async (req, res) => {
  res.json(questions);
});

const port = app.get('port');
const server = app.listen(port, () =>
  Logger.debug(
    `Server started on port ${port} & v ${window?.env?.VERSION_NAME}(${window?.env?.VERSION_CODE})`
  )
);

const sqs = new AWS.SQS();
const ses = new AWS.SES();

app.get('/createTemplate', async (req, res) => {
  const params = {
    Template: {
      TemplateName: 'VerifyTestDetailsScheme',
      SubjectPart: 'Congratulations {{name}}!', // Use a placeholder for dynamic subject
      HtmlPart: `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Welcome to our community</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #333;
            }
            p {
              color: #666;
            }
            .cta-button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #ff6600;
              color: #fff;
              text-decoration: none;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <p>Dear {{organiserName}}</p>
            <p>Explore and discover the amazing features we offer:</p>
            <p>Congratulation, here is the New Customer Details (Mr/Ms {{name}} and {{phoneNumber}} & {{email}} ) is Interested in your products and Services. we request you to please Contact the valuable Customers ASAP.
            <p>Regards, <br> Team - ServicePlug  </p> <!-- Escape $ character for the subject -->
          </div>
        </body>
        </html>`,
      TextPart: 'Plain text content goes here'
    }
  };
  console.log(params)

  ses.createTemplate(params, (err, data) => {
    if (err) {
      console.log('Error creating email template: ', err);
      res.status(500).send({ error: 'Failed to create email template' });
    } else {
      console.log('Email template created ', data);
      res.send(data);
    }
  });
});
app.post('/sendToSQS', async (req, res) => {
  // Check if 'to', 'subject', and 'templateName' properties exist in req.body

  const params = {
    MessageBody: JSON.stringify({
      to: req.body.to,
      name: req.body.name,
      templateName: req.body.templateName
    }),
    QueueUrl:
      'https://sqs.ap-southeast-2.amazonaws.com/771470636147/ServicePlug' // Replace with your SQS queue URL
  };

  console.log(params, 'wkf');
  await sendEmail(
    req.body.to,
    req.body.name,
    req.body.phoneNumber,
    req.body.email,
    req.body.organiserName,
    req.body.templateName
  );

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send({ error: 'Failed to send message to SQS' });
    } else {
      res.send(data);
    }
  });
});


async function sendEmail(to: any, name: any,phoneNumber: any, email: any, organiserName:any, templateName: any) {
  // Construct the email payload with template

  const templateData = {
    // Include properties that match the placeholders in your SES template
    // For example:
    User: 'Ayush',
    name: name,
    phoneNumber: phoneNumber,
    organiserName: organiserName,
    email: email,
    // lastName: "Doe",
    // ...
  };

  const emailParams = {
    Destination: {
      ToAddresses: [to]
    },
    Template: templateName, // Replace with your SES template name
    Source: 'ayush@serviceplug.in',
    TemplateData: JSON.stringify(templateData) // Replace with your verified SES email address
  };
  console.log(emailParams);

  // Send email using AWS SES
  const res = await ses.sendTemplatedEmail(emailParams).promise();

  console.log('Email sent:', res.MessageId);
}

export default server;

// exports.handler = async (event: { Records: any }) => {
//   const { Records } = event;

//   for (const record of Records) {
//     const body = JSON.parse(record.body);
//     console.log(body,"wkfd")

//     // Assuming 'to', 'subject', and 'message' are properties in the SQS message
//     const to = body.to;
//     const subject = body.subject;
//     const message = body.message;

//     // Send email using Gmail API
//     await sendEmail(to, subject, message);
//   }

//   return { statusCode: 200, body: 'Messages processed successfully.' };
// };