
import nodemailer from "nodemailer";

/**
 * Sends an email using SMTP transport.
 * 
 * @param to The recipient's email address.
 * @param subject The email subject.
 * @param html The HTML content of the email.
 */
export async function sendEmailSMTP(to: string, subject: string, html: string) {
  // These environment variables should be configured in Brevo/SMTP provider
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "ICSA Operaciones"}" <${process.env.MAIL_FROM_ADDRESS || "no-reply@icsa.com"}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
