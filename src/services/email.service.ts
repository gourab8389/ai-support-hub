import { transporter } from "@/config/email";
import { env } from "@/config/env";

export class EmailService {
  async sendVerificationEmail(email: string, token: string, name: string) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Verify Your Email - AI Support Hub",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Email Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .header {
      background: #6366f1;
      color: #ffffff;
      padding: 24px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      padding: 32px;
      color: #333333;
      line-height: 1.6;
      font-size: 15px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #6366f1;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 24px 0;
      font-weight: bold;
    }
    .link {
      word-break: break-all;
      color: #6366f1;
      font-size: 13px;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      AI Support Hub
    </div>

    <div class="content">
      <p>Hi <strong>${name}</strong>,</p>

      <p>
        Welcome to <strong>AI Support Hub</strong> 🎉  
        Please verify your email address to activate your account.
      </p>

      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">
          Verify Email Address
        </a>
      </p>

      <p>
        Or copy and paste this link into your browser:
      </p>

      <p class="link">
        ${verificationUrl}
      </p>

      <p>
        ⏰ This link will expire in <strong>24 hours</strong>.
      </p>

      <p>
        If you didn’t create an account, you can safely ignore this email.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} AI Support Hub. All rights reserved.
    </div>
  </div>
</body>
</html>
    `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, name: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Reset Your Password - AI Support Hub",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Password Reset</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .header {
      background: #6366f1;
      color: #ffffff;
      padding: 24px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      padding: 32px;
      color: #333333;
      line-height: 1.6;
      font-size: 15px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #6366f1;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 24px 0;
      font-weight: bold;
    }
    .link {
      word-break: break-all;
      color: #6366f1;
      font-size: 13px;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      Password Reset
    </div>

    <div class="content">
      <p>Hi <strong>${name}</strong>,</p>

      <p>
        We received a request to reset your password.  
        Click the button below to create a new one.
      </p>

      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">
          Reset Password
        </a>
      </p>

      <p>
        Or copy and paste this link:
      </p>

      <p class="link">
        ${resetUrl}
      </p>

      <p>
        ⏰ This link will expire in <strong>1 hour</strong>.
      </p>

      <p>
        If you didn’t request this, please ignore this email or contact support.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} AI Support Hub. All rights reserved.
    </div>
  </div>
</body>
</html>
    `,
    });
  }

  async sendTicketNotification(
    agentEmail: string,
    ticketSubject: string,
    customerName: string,
    ticketId: string
  ) {
    const ticketUrl = `${env.FRONTEND_URL}/tickets/${ticketId}`;

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: agentEmail,
      subject: `New Support Ticket: ${ticketSubject}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>New Ticket</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .header {
      background: #6366f1;
      color: #ffffff;
      padding: 24px;
      text-align: center;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      padding: 32px;
      color: #333333;
      line-height: 1.6;
      font-size: 15px;
    }
    .ticket-box {
      background: #f9fafb;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #6366f1;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      New Ticket Assigned
    </div>

    <div class="content">
      <p>You have been assigned a new support ticket.</p>

      <div class="ticket-box">
        <p><strong>Subject:</strong> ${ticketSubject}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
      </div>

      <p style="text-align: center;">
        <a href="${ticketUrl}" class="button">
          View Ticket
        </a>
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} AI Support Hub. All rights reserved.
    </div>
  </div>
</body>
</html>
    `,
    });
  }
}

export const emailService = new EmailService();
