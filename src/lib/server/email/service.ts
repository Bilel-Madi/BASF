import * as brevo from '@getbrevo/brevo';
import { getWelcomeEmailTemplate } from './templates/welcome';

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export class EmailService {
  private static apiInstance = new brevo.TransactionalEmailsApi();

  private static initialize() {
    const apiKey = this.apiInstance.authentications['apiKey'];
    apiKey.apiKey = BREVO_API_KEY;
  }

  static async sendEmail(params: {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    sender?: { name: string; email: string };
  }) {
    this.initialize();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    sendSmtpEmail.sender = params.sender || {
      name: "Arddata™",
      email: "support@arddata.com"
    };
    sendSmtpEmail.to = params.to;

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  static async sendWelcomeEmail(email: string, firstName: string = '') {
    try {
      await this.sendEmail({
        to: [{ email }],
        subject: "Welcome to Arddata™",
        htmlContent: getWelcomeEmailTemplate(email, firstName)
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error - we don't want to interrupt the signup process
    }
  }
} 