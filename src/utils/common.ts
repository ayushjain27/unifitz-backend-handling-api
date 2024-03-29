import Store, { IStore } from '../models/Store';
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();
import path from 'path';

export function appendCodeToPhone(phoneNumber: string) {
  return `+91${phoneNumber?.slice(-10)}`;
}

import AWS from 'aws-sdk';
import { s3Config } from '../config/constants';

AWS.config.update({
  accessKeyId: s3Config.AWS_KEY_ID,
  secretAccessKey: s3Config.ACCESS_KEY,
  region: 'ap-south-1'
});

// emailService.js

const { SES } = require('aws-sdk'); // Import the AWS SDK

// Create an instance of SES
const sqs = new AWS.SQS();
const ses = new SES();

// Define the sendEmail function
export async function sendEmail(
  templateData: any,
  to: any,
  source: any,
  templateName: any
) {
  const emailParams = {
    Destination: {
      ToAddresses: [to]
    },
    Template: templateName, // Replace with your SES template name
    Source: source,
    TemplateData: JSON.stringify(templateData) // Replace with your verified SES email address
  };
  console.log(emailParams);

  try {
    // Send email using AWS SES
    const res = await ses.sendTemplatedEmail(emailParams).promise();
    console.log('Email sent:', res.MessageId);
    return res.MessageId; // Return the MessageId if needed
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Rethrow the error to handle it at the caller's level
  }
}

export async function sendToSqs(jobCard: any, uniqueMessageId: any) {
  const params = {
    MessageBody: JSON.stringify(jobCard),
    QueueUrl:
      'https://sqs.ap-south-1.amazonaws.com/771470636147/SPAsyncQueue.fifo', // Replace with your SQS queue URL
    MessageGroupId: uniqueMessageId,
    MessageDeduplicationId: uniqueMessageId
  };

  try {
    const data = await sqs.sendMessage(params).promise();
    // console.log(data,"fwkl")
    // res.send(data);
  } catch (err) {
    console.error(err);
    // res.status(500).send({ error: 'Failed to send message to SQS' });
  }
}

export async function receiveFromSqs() {
  const params = {
    QueueUrl:
      'https://sqs.ap-south-1.amazonaws.com/771470636147/SPAsyncQueue.fifo', // Replace with your SQS queue URL
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 5 // Long-polling for better efficiency
    // VisibilityTimeout: 30 // Adjust as needed
  };

  try {
    while (true) {
      console.log('dwnjkf,w');
      const data = await sqs.receiveMessage(params).promise();
      if (!data.Messages) {
        // return "There are no messages left"
        break;
      }
      console.log(data, 'fwl;km');

      if (data.Messages && data.Messages.length > 0) {
        console.log('Afl');
        const message = data.Messages[0];
        const jobCard = JSON.parse(message.Body);
        console.log(message, 'wfe;lm');
        await deleteMessageFromQueue(message.ReceiptHandle);
        console.log(jobCard?.jobCardNumber, 'fmlwf');
        let store: IStore;
        if (jobCard?.storeId) {
          store = await Store.findOne(
            { storeId: jobCard?.storeId },
            { verificationDetails: 0 }
          );
        }
        pdfDesign(store, jobCard);
      }
    }
  } catch (error) {
    console.error('Error receiving or processing messages:', error);
  }
  // if (data.Messages && data.Messages.length > 0) {
  // const message = data.Messages[0];
  //   const jobCard = JSON.parse(message.Body);

  // let store: IStore;
  // if (jobCard?.storeId) {
  //   store = await Store.findOne(
  //     { storeId: jobCard?.storeId },
  //     { verificationDetails: 0 }
  //   );
  // }

  // Generate PDF using userData...

  // Delete the message from the queue
  // const deleteParams = {
  //   QueueUrl: params.QueueUrl,
  //   ReceiptHandle: message.ReceiptHandle
  // };

  // await new Promise((resolve, reject) => {
  //   sqs.deleteMessage(deleteParams, (err) => {
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve();
  //     }
  //   });
  // });

  // console.log('Message Deleted');
  //   }
  // } catch (err) {
  //   console.error(err);
  //   // Handle error accordingly
  // }
}

async function deleteMessageFromQueue(receiptHandle: string) {
  const deleteParams = {
    QueueUrl:
      'https://sqs.ap-south-1.amazonaws.com/771470636147/SPAsyncQueue.fifo', // Replace with your SQS queue URL,
    ReceiptHandle: receiptHandle
  };

  await sqs.deleteMessage(deleteParams).promise();
  console.log('Message deleted from the queue');
}

export async function pdfDesign(store: any, jobCard: any) {
  const doc = new PDFDocument({ size: 'A4' });

  // Pipe the PDF document to a write stream
  const writeStream = fs.createWriteStream('invoices.pdf');
  doc.pipe(writeStream);

  const createdAtString = jobCard?.createdAt;
  const registrationYearString =
    jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]?.registrationYear;
  const createdAtDate = new Date(createdAtString);
  const registrationYearDate = new Date(registrationYearString);

  const createdAtDateYear = createdAtDate.getFullYear();
  const createdAtDateMonth = createdAtDate.getMonth() + 1; // Months are zero-indexed, so January is 0
  const createdAtDateDay = createdAtDate.getDate();
  const registrationYearDateYear = registrationYearDate.getFullYear();
  const registrationYearDateMonth = registrationYearDate.getMonth() + 1; // Months are zero-indexed, so January is 0
  const registrationYearDateDay = registrationYearDate.getDate();

  const invoiceDate = `${createdAtDateYear}-${
    createdAtDateMonth < 10 ? '0' + createdAtDateMonth : createdAtDateMonth
  }-${createdAtDateDay < 10 ? '0' + createdAtDateDay : createdAtDateDay}`;
  const regNo = `${registrationYearDateYear}-${
    registrationYearDateMonth < 10
      ? '0' + registrationYearDateMonth
      : registrationYearDateMonth
  }-${
    registrationYearDateDay < 10
      ? '0' + registrationYearDateDay
      : registrationYearDateDay
  }`;

  const nextServiceDateString = new Date(jobCard?.createdAt);
  nextServiceDateString.setMonth(nextServiceDateString.getMonth() + 6);

  // Extract year, month, and day from the modified invoiceDate
  const year = nextServiceDateString.getFullYear();
  const month = nextServiceDateString.getMonth() + 1; // Months are zero-based, so add 1
  const day = nextServiceDateString.getDate();

  // Format the date string
  const nextServiceDate = `${year}-${month < 10 ? '0' + month : month}-${
    day < 10 ? '0' + day : day
  }`;

  const brand = jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]?.brand;
  const model =
    jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]?.modelName;
  const kmsDrive =
    jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]?.totalKmsRun;
  const fuelType =
    jobCard?.customerDetails[0]?.storeCustomerVehicleInfo[0]?.fuelType;
  // const nextServiceDate = formattedDate;

  // Set up some styling
  function addHeader() {
    doc.moveDown();
    doc.fontSize(16);
    doc.moveUp(2);
    doc.fontSize(24).text('JOBCARD', 390, doc.y - 3, {
      width: 200
    });
    doc.fontSize(12).text(`JobCard No: ${jobCard?.jobCardNumber}`, 390, doc.y, {
      width: 150
    });
    doc.fontSize(12).text(`JobCard Date: ${invoiceDate}`, 390, doc.y, {
      width: 150
    });

    // Draw the underline
    doc.underline(40, 110, 545, 2);
  }

  function addFooter() {
    doc.underline(40, 735, 545, 2);
    doc.fontSize(10).text('Powered by ServicePlug', 40, 750, { align: 'left' });
    doc.fontSize(10).text('Download', 430, 750, { width: 100, align: 'right' });
    doc.link(540, 748, 300, 50, 'https://google.com'); // Add your link URL here
    doc.image(
      'data:image/png;base64,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',
      540,
      748,
      { width: 15, align: 'right' }
    );
    doc.link(560, 748, 300, 50, 'https://google.com'); // Add your link URL here
    doc.image(
      'data:image/jpeg;base64,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',
      560,
      748,
      { width: 15, align: 'right' }
    );
    doc.moveUp(52);
  }

  doc.on('pageAdded', () => {
    addHeader();
    addFooter();
  });

  addHeader();
  addFooter();

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .text(store?.basicInfo?.businessName, 40, doc.y - 30, {
      width: 500,
      align: 'left'
    });
  doc
    .font('Helvetica')
    .fontSize(12)
    .text(store?.contactInfo?.address, 40, doc.y + 5, {
      width: 500,
      align: 'left'
    });
  doc.text(store?.contactInfo?.phoneNumber?.primary, 40, doc.y + 5, {
    width: 180,
    align: 'left'
  });
  doc.text(store?.storeId, 40, doc.y + 5, {
    width: 300,
    align: 'left'
  });

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Bill To', 40, doc.y + 20, { width: 180, align: 'left' });
  doc.font('Helvetica').text(jobCard?.customerDetails[0]?.name, 40, doc.y + 5, {
    width: 180,
    align: 'left'
  });
  doc.text('Address........', 40, doc.y + 5, { width: 180, align: 'left' });
  doc.text(jobCard?.customerDetails[0]?.billingAddress, 40, doc.y + 5, {
    width: 300,
    align: 'left'
  });
  doc.text(jobCard?.customerDetails[0]?.email, 40, doc.y + 8, {
    width: 180,
    align: 'left'
  });
  doc.text(jobCard?.customerDetails[0]?.phoneNumber, 40, doc.y + 5, {
    width: 180,
    align: 'left'
  });
  // doc.text(`From: ${companyName}`);
  doc.moveUp(6.2);
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Vehicle Details', 400, doc.y - 20, { width: 200 });
  doc
    .font('Helvetica')
    .text(`Reg No: ${regNo}`, 400, doc.y + 5, { width: 200 });
  doc.text(`Brand Name: ${brand}`, 400, doc.y + 5, { width: 200 });
  doc.text(`Model: ${model}`, 400, doc.y + 5, { width: 200 });
  doc.text(`Kms Drive: ${kmsDrive}`, 400, doc.y + 5, { width: 200 });
  doc.text(`Fuel Type: ${fuelType}`, 400, doc.y + 5, { width: 200 });
  doc.text(`Next Service Date: ${nextServiceDate}`, 400, doc.y + 5, {
    width: 200
  });

  // Print table header
  doc.moveDown();
  doc.font('Helvetica-Bold');
  doc.text('NAME', 70, doc.y, { width: 200 });
  doc.moveUp(1);
  doc.text('OTY', 285, doc.y, { width: 50, align: 'right' });
  doc.moveUp(1);
  doc.text('PRICE', 350, doc.y, { width: 100, align: 'right' });
  doc.moveUp(1);
  doc.text('TOTAL', 450, doc.y, { width: 100, align: 'right' });
  doc.underline(35, doc.y + 10, 545, 2);

  let totalAmount = 0;
  let y = doc.y + 20; // Initial y position for the first row

  jobCard.lineItems.forEach((values: any, index: any) => {
    const { item, quantity, rate } = values;

    // Check if the current row will overflow to the next page
    if (y > doc.page.height - 150) {
      doc.addPage(); // Start a new page
      y = doc.y; // Reset y position
      // Recreate the table header
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('ITEM', 70, y, { width: 200 });
      doc.text('QUANTIY', 290, y, { width: 50, align: 'right' });
      doc.text('RATE', 410, y, { width: 100, align: 'left' });
      doc.text('TOTAL', 520, y, { width: 100, align: 'left' });
      doc.underline(35, doc.y + 5, 545, 2);
      y += 30; // Move y position to the first row after the header
    }

    // Draw the current row
    doc.font('Helvetica');
    doc.text(item, 70, y, { width: 200 });
    doc.text(quantity.toString(), 280, y, { width: 50, align: 'right' });
    doc.text('Rs ' + rate.toString(), 410, y, {
      width: 100,
      align: 'left'
    });
    const total = quantity * rate;
    totalAmount += total;
    doc.text('Rs ' + total, 520, y, { width: 100, align: 'left' });
    if (index < jobCard.lineItems.length - 1) {
      doc.underline(35, y + 20, 545, 2);
      // doc.moveDown(1.3);
    }
    // doc.underline(35, y, 545, 2);
    y += 30; // Move y position to the next row
  });

  // Print total amount
  let tax = 0;
  let totalBill = totalAmount + tax;
  doc.underline(35, doc.y + 5, 545, 2);
  doc.moveDown();
  if (doc.y > doc.page.height - 150) {
    doc.addPage();
    doc.text(`Sub-total:                   Rs ${totalAmount}`, 385, doc.y + 8, {
      width: 200,
      align: 'right'
    });
    doc.underline(370, doc.y + 5, 210, 2);
  } else {
    doc.text(`Sub-total:                   Rs ${totalAmount}`, 385, doc.y + 8, {
      width: 200,
      align: 'right'
    });
    doc.underline(370, doc.y + 5, 210, 2);
  }
  doc.moveDown();
  if (doc.y > doc.page.height - 150) {
    doc.addPage();
    doc.font('Helvetica-Bold');
    doc.text(`Total:                     Rs ${totalBill}`, 380, doc.y, {
      width: 200,
      align: 'right'
    });
    doc.underline(370, doc.y + 5, 210, 2);
  } else {
    doc.font('Helvetica-Bold');
    doc.text(`Total:                     Rs ${totalBill}`, 380, doc.y, {
      width: 200,
      align: 'right'
    });
    doc.underline(370, doc.y + 5, 210, 2);
  }

  if (doc.y > doc.page.height - 200) {
    doc.addPage();
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    doc.fontSize(24).text('Thank You!', 350, doc.y + 40, {
      width: 200,
      align: 'right'
    });

    doc.font('Helvetica');
    doc.underline(30, doc.y - 15, 210, 2);
    doc.fontSize(16).text(store?.basicInfo?.ownerName, 0, doc.y, {
      width: 150,
      align: 'right'
    });
  } else {
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    doc.fontSize(24).text('Thank You!', 350, doc.y + 40, {
      width: 200,
      align: 'right'
    });

    doc.font('Helvetica');
    doc.underline(30, doc.y - 15, 210, 2);
    doc.fontSize(16).text(store?.basicInfo?.ownerName, 0, doc.y, {
      width: 150,
      align: 'right'
    });
  }

  if (doc.y > doc.page.height - 200) {
    doc.addPage();
    doc.moveDown(2);
    doc.font('Helvetica');
    doc.text(
      'Declaration : All Products and Services,Price,Warranty Please contact respective Partners',
      80,
      doc.y,
      {
        width: '100%',
        align: 'center'
      }
    );
  } else {
    doc.moveDown(2);
    doc.font('Helvetica-Bold');
    doc.fontSize(12).text('Declaration :', 40, doc.y + 20, {
      width: 500,
      align: 'left'
    });
    doc.font('Helvetica');
    doc
      .fontSize(12)
      .text(
        'All Products and Services,Price,Warranty Please contact respective Partners',
        120,
        doc.y - 14,
        {
          width: 500,
          align: 'left'
        }
      );
  }
  // Finalize the PDF
  doc.end();
  // Close the write stream once the PDF is finished writing

  console.log('adsnk');

  jobCardEmail(store, jobCard);
}

export async function jobCardEmail(store: any, jobCard: any) {
  const transporter = nodemailer.createTransport({
    SES: { ses, aws: AWS }
  });
  try {
    const mailOptions = {
      from: {
        address: 'support@serviceplug.in'
      },
      to: [jobCard?.customerDetails[0]?.email],
      subject: 'Congratulations!',
      text: 'Plain text content goes here',
      html: `<!DOCTYPE html>
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
                    .logo {
                      color: 'black',
                      fontWeight: 'bold'
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <p>Dear ${jobCard?.customerDetails[0]?.name}</p>
                    <p>We hope this email finds you well. Here is the vehicle job card generated by ${store?.basicInfo?.businessName}</p>
                    <p>Feel free to contact us at ${store?.basicInfo?.ownerName} @ ${store?.contactInfo?.phoneNumber?.primary}</p>
                    <p>Thank you for choosing ServicePlug Platform for your vehicle service needs. We look forward to serving you and providing an exceptional experience.</p>
                    <p>Warm regards, </p> <!-- Escape $ character for the subject -->
                    <p class="logo">SERVICEPLUG</p> <!-- Escape $ character for the subject -->
                  </div>
                </body>
                </html>`,
      attachments: [
        {
          fileName: 'invoices.pdf',
          path: path.join(__dirname, '..', '..', 'invoices.pdf'),
          contentType: 'application/pdf'
        }
      ]
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (err) {
    console.log(err, 'dwl;k');
  }
}
