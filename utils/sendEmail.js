const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use other services like 'smtp', 'mailgun', etc.
    host: "smtp.gmail.com", // The host
    auth: {
      user: process.env.EMAIL, // Store this in your .env file
      pass: process.env.EMAIL_PASSWORD, // Store this in your .env file
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;
