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
        
        
          
            
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #6366f1; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0;
              }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            
          
          
            
              Reset Your Password
              Hi ${name},
              We received a request to reset your password. Click the button below to create a new password:
              Reset Password
              Or copy and paste this link into your browser:
              ${resetUrl}
              This link will expire in 1 hour.
              
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              
            
          
        
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
        
        
          
            
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .ticket-info { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background: #6366f1; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0;
              }
            
          
          
            
              New Support Ticket Assigned
              
                Subject: ${ticketSubject}
                Customer: ${customerName}
                Ticket ID: ${ticketId}
              
              View Ticket
            
          
        
      `,
    });
  }
}

export const emailService = new EmailService();
