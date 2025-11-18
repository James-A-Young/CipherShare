import sgMail from "@sendgrid/mail";

export class EmailService {
  private readonly fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail;
  }

  async sendRetrievalLink(
    recipientEmail: string,
    description: string,
    retrievalUrl: string
  ): Promise<void> {
    const msg = {
      to: recipientEmail,
      from: this.fromEmail,
      subject: "CipherShare - Secret Ready for Retrieval",
      text: `A secret has been submitted for your request: "${description}"\n\nRetrieve it here: ${retrievalUrl}\n\nYou will need the password that was shared with you separately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1f2937; color: #f3f4f6; border-radius: 8px;">
          <h2 style="color: #60a5fa;">🔐 CipherShare - Secret Ready</h2>
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
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent to ${recipientEmail}`);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }
}
