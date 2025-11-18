import sgMail from "@sendgrid/mail";
import formData from "form-data";
import Mailgun from "mailgun.js";

// Email provider interface
interface IEmailProvider {
  sendEmail(
    to: string,
    subject: string,
    textContent: string,
    htmlContent: string
  ): Promise<void>;
}

// SendGrid implementation
class SendGridProvider implements IEmailProvider {
  private readonly fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail;
  }

  async sendEmail(
    to: string,
    subject: string,
    textContent: string,
    htmlContent: string
  ): Promise<void> {
    const msg = {
      to,
      from: this.fromEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`[SendGrid] Email sent to ${to}`);
  }
}

// Mailgun implementation
class MailgunProvider implements IEmailProvider {
  private readonly client: any;
  private readonly fromEmail: string;
  private readonly domain: string;

  constructor(apiKey: string, domain: string, fromEmail: string) {
    const mailgun = new Mailgun(formData);
    this.client = mailgun.client({ username: "api", key: apiKey });
    this.domain = domain;
    this.fromEmail = fromEmail;
  }

  async sendEmail(
    to: string,
    subject: string,
    textContent: string,
    htmlContent: string
  ): Promise<void> {
    const messageData = {
      from: this.fromEmail,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    };

    await this.client.messages.create(this.domain, messageData);
    console.log(`[Mailgun] Email sent to ${to}`);
  }
}

// Email service configuration
export interface EmailServiceConfig {
  provider: "sendgrid" | "mailgun";
  fromEmail: string;
  // SendGrid config
  sendgridApiKey?: string;
  // Mailgun config
  mailgunApiKey?: string;
  mailgunDomain?: string;
}

export class EmailService {
  private readonly provider: IEmailProvider;

  constructor(config: EmailServiceConfig) {
    // Select provider based on configuration
    if (config.provider === "mailgun") {
      if (!config.mailgunApiKey || !config.mailgunDomain) {
        throw new Error(
          "Mailgun API key and domain are required when using Mailgun provider"
        );
      }
      this.provider = new MailgunProvider(
        config.mailgunApiKey,
        config.mailgunDomain,
        config.fromEmail
      );
      console.log("📧 Email service initialized with Mailgun");
    } else {
      // Default to SendGrid
      if (!config.sendgridApiKey) {
        console.warn(
          "⚠️ SendGrid API key not configured, email notifications will fail"
        );
      }
      this.provider = new SendGridProvider(
        config.sendgridApiKey || "",
        config.fromEmail
      );
      console.log("📧 Email service initialized with SendGrid");
    }
  }

  async sendRetrievalLink(
    recipientEmail: string,
    description: string,
    reference: string | undefined,
    retrievalUrl: string
  ): Promise<void> {
    const referenceText = reference ? ` (Reference: ${reference})` : "";
    const referenceHtml = reference
      ? `<p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">Reference: <strong style="color: #f3f4f6;">${reference}</strong></p>`
      : "";

    const subject = `CipherShare - Secret Ready for Retrieval${referenceText}`;
    const textContent = `A secret has been submitted for your request: "${description}"${referenceText}\n\nRetrieve it here: ${retrievalUrl}\n\nYou will need the password that was shared with you separately.`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1f2937; color: #f3f4f6; border-radius: 8px;">
        <h2 style="color: #60a5fa;">🔐 CipherShare - Secret Ready</h2>
        ${referenceHtml}
        <p>A secret has been submitted for your request:</p>
        <p style="background-color: #374151; padding: 15px; border-radius: 4px; border-left: 4px solid #60a5fa;">
          <strong>"${description}"</strong>
        </p>
        <p>Click the button below to retrieve it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${retrievalUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Retrieve Secret
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">
          ⚠️ You will need the password that was shared with you through a separate secure channel.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          This is an automated message from CipherShare. Please do not reply to this email.
        </p>
      </div>
    `;

    try {
      await this.provider.sendEmail(
        recipientEmail,
        subject,
        textContent,
        htmlContent
      );
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }
}
