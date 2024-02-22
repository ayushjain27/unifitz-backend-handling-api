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
const ses = new SES();

// Define the sendEmail function
export async function sendEmail(templateData: any, to: any, source: any, templateName: any) {

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