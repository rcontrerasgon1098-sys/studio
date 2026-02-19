
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Sends an email using SMTP transport with Nodemailer and Brevo credentials.
 * 
 * @param options Object containing recipient, subject, html content and optional attachments.
 */
export async function sendEmailSMTP(options: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false 
    }
  });

  try {
    const fromName = process.env.MAIL_FROM_NAME || "ICSA Operaciones";
    const fromAddress = process.env.MAIL_FROM_ADDRESS || "no-reply@icsa.com";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    
    console.log(`Email sent successfully via Brevo. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email via SMTP (Brevo):", error);
    
    // Catch specific SMTP auth error to provide a better debug message
    if (error.responseCode === 535) {
      throw new Error("Fallo de autenticación SMTP. Por favor verifique su clave SMTP en el archivo .env.");
    }
    
    throw error;
  }
}
