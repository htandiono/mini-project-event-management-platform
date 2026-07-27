import nodemailer from "nodemailer";
import { getEnv } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const env = getEnv();
    await getTransporter().sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`Failed to send email to ${to} [${subject}]:`, error);
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #c94f43;">Welcome to Eventure!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for creating an account with Eventure. You can now discover amazing events or start organizing your own!</p>
      <p>Best regards,<br>The Eventure Team</p>
    </div>
  `;
  await sendEmail(to, "Welcome to Eventure!", html);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string,
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #c94f43;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetLink}" style="display: inline-block; background: #c94f43; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p>If you did not request a password reset, please ignore this email. This link expires in 1 hour.</p>
      <p>Best regards,<br>The Eventure Team</p>
    </div>
  `;
  await sendEmail(to, "Reset your Eventure password", html);
}

export async function sendTransactionAcceptedEmail(
  to: string,
  customerName: string,
  eventTitle: string,
  invoiceNumber: string,
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #176d65;">Payment Confirmed!</h2>
      <p>Hello ${customerName},</p>
      <p>Your payment for <strong>${eventTitle}</strong> (Invoice: ${invoiceNumber}) has been verified and confirmed by the organizer.</p>
      <p>We look forward to seeing you at the event!</p>
      <p>Best regards,<br>The Eventure Team</p>
    </div>
  `;
  await sendEmail(to, `Payment Confirmed - ${eventTitle}`, html);
}

export async function sendTransactionRejectedEmail(
  to: string,
  customerName: string,
  eventTitle: string,
  invoiceNumber: string,
  reason?: string,
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #c94f43;">Payment Verification Failed</h2>
      <p>Hello ${customerName},</p>
      <p>Unfortunately, your payment for <strong>${eventTitle}</strong> (Invoice: ${invoiceNumber}) could not be verified and your transaction was rejected.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>Any used points, coupons, or vouchers have been restored to your account.</p>
      <p>Best regards,<br>The Eventure Team</p>
    </div>
  `;
  await sendEmail(to, `Transaction Rejected - ${eventTitle}`, html);
}
