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

              Welcome to AI Support Hub, ${name}!
              Thank you for signing up. Please verify your email address to get started.
              Verify Email Address
              Or copy and paste this link into your browser:
              ${verificationUrl}
              This link will expire in 24 hours.
              
                If you didn't create an account, please ignore this email.
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
