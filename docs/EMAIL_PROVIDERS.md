# Email Provider Configuration

## Overview

CipherShare supports multiple email providers through a flexible provider pattern. Currently supported providers:

- **SendGrid** - Popular transactional email service
- **Mailgun** - Reliable email delivery platform

The email provider is configured via the `EMAIL_PROVIDER` environment variable, allowing easy switching between providers without code changes.

## Provider Selection

### Environment Variable

```env
EMAIL_PROVIDER=sendgrid  # Options: "sendgrid" or "mailgun"
```

The application will automatically use the specified provider at runtime.

## SendGrid Configuration

### Setup

1. **Create SendGrid Account**

   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Free tier: 100 emails/day

2. **Generate API Key**

   - Navigate to Settings → API Keys
   - Click "Create API Key"
   - Select "Full Access" or "Restricted Access" with Mail Send permission
   - Copy the generated key (shown only once)

3. **Verify Sender Email**
   - Navigate to Settings → Sender Authentication
   - Verify a single sender email address, or
   - Configure domain authentication for professional setup

### Environment Variables

```env
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### Configuration Example

```typescript
// Automatic based on EMAIL_PROVIDER
const emailService = EmailService.create({
  provider: process.env.EMAIL_PROVIDER || "sendgrid",
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  fromEmail: process.env.EMAIL_FROM || "noreply@example.com",
});
```

### SendGrid Features

- ✅ Easy setup with API key
- ✅ Generous free tier (100/day)
- ✅ Excellent deliverability
- ✅ Comprehensive analytics dashboard
- ✅ Email validation tools
- ❌ Can be expensive at scale

## Mailgun Configuration

### Setup

1. **Create Mailgun Account**

   - Sign up at [mailgun.com](https://mailgun.com)
   - Free tier: 5,000 emails/month (3 months trial)

2. **Get API Credentials**

   - Navigate to Settings → API Keys
   - Copy your Private API Key
   - Note your sandbox domain or add your own domain

3. **Domain Configuration**
   - For production: Add and verify your domain
   - For testing: Use the provided sandbox domain
   - Configure DNS records (SPF, DKIM, CNAME)

### Environment Variables

```env
EMAIL_PROVIDER=mailgun
EMAIL_FROM=noreply@yourdomain.com
MAILGUN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxx
MAILGUN_DOMAIN=yourdomain.com  # or sandbox123abc.mailgun.org for testing
```

### Configuration Example

```typescript
// Automatic based on EMAIL_PROVIDER
const emailService = EmailService.create({
  provider: process.env.EMAIL_PROVIDER || "sendgrid",
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  fromEmail: process.env.EMAIL_FROM || "noreply@example.com",
});
```

### Mailgun Features

- ✅ Better free tier (5,000/month)
- ✅ More affordable at scale
- ✅ Powerful API and webhooks
- ✅ Advanced routing rules
- ✅ Built-in email validation API
- ❌ More complex domain setup

## Provider Comparison

| Feature                 | SendGrid  | Mailgun     |
| ----------------------- | --------- | ----------- |
| **Free Tier**           | 100/day   | 5,000/month |
| **Setup Difficulty**    | Easy      | Moderate    |
| **Domain Config**       | Optional  | Recommended |
| **API Complexity**      | Simple    | Moderate    |
| **Analytics**           | Excellent | Good        |
| **Cost (1M emails/mo)** | ~$89.95   | ~$35        |
| **Deliverability**      | Excellent | Excellent   |

## Implementation Details

### Provider Interface

All email providers implement the `IEmailProvider` interface:

```typescript
interface IEmailProvider {
  sendRetrievalLink(
    to: string,
    retrievalUrl: string,
    description: string,
    reference?: string
  ): Promise<void>;
}
```

### SendGrid Implementation

```typescript
class SendGridProvider implements IEmailProvider {
  private client: MailService;

  constructor(apiKey: string, fromEmail: string) {
    this.client = new MailService();
    this.client.setApiKey(apiKey);
    this.fromEmail = fromEmail;
  }

  async sendRetrievalLink(
    to: string,
    retrievalUrl: string,
    description: string,
    reference?: string
  ): Promise<void> {
    const msg = {
      to,
      from: this.fromEmail,
      subject: reference
        ? `Secret Ready for Retrieval - ${reference}`
        : "Secret Ready for Retrieval",
      html: this.buildEmailTemplate(retrievalUrl, description, reference),
    };

    await this.client.send(msg);
  }
}
```

### Mailgun Implementation

```typescript
class MailgunProvider implements IEmailProvider {
  private client: IMailgunClient;

  constructor(apiKey: string, domain: string, fromEmail: string) {
    this.client = new Mailgun(FormData).client({
      username: "api",
      key: apiKey,
    });
    this.domain = domain;
    this.fromEmail = fromEmail;
  }

  async sendRetrievalLink(
    to: string,
    retrievalUrl: string,
    description: string,
    reference?: string
  ): Promise<void> {
    const messageData = {
      from: this.fromEmail,
      to,
      subject: reference
        ? `Secret Ready for Retrieval - ${reference}`
        : "Secret Ready for Retrieval",
      html: this.buildEmailTemplate(retrievalUrl, description, reference),
    };

    await this.client.messages.create(this.domain, messageData);
  }
}
```

### Factory Pattern

```typescript
class EmailService {
  static create(config: EmailConfig): IEmailProvider {
    if (config.provider === "mailgun") {
      return new MailgunProvider(
        config.mailgunApiKey!,
        config.mailgunDomain!,
        config.fromEmail
      );
    }
    // Default to SendGrid
    return new SendGridProvider(config.sendgridApiKey!, config.fromEmail);
  }
}
```

## Email Template

Both providers use the same HTML email template:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif;"
  >
    <div
      style="max-width: 600px; margin: 40px auto; background-color: #1e293b; border-radius: 8px; padding: 40px;"
    >
      <h1 style="color: #60a5fa; margin: 0 0 20px 0;">
        🔐 Secret Ready for Retrieval
      </h1>

      <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
        A secret has been submitted for:
        <strong style="color: #ffffff;">${description}</strong>
      </p>

      ${reference ? `
      <p style="color: #cbd5e1; font-size: 14px; margin: 10px 0;">
        <strong>Reference:</strong>
        <span style="color: #ffffff;">${reference}</span>
      </p>
      ` : ''}

      <div
        style="margin: 30px 0; padding: 20px; background-color: #334155; border-left: 4px solid #60a5fa; border-radius: 4px;"
      >
        <p style="color: #cbd5e1; margin: 0 0 10px 0; font-size: 14px;">
          Click the button below to retrieve your secret:
        </p>
        <a
          href="${retrievalUrl}"
          style="display: inline-block; margin: 10px 0; padding: 12px 24px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;"
        >
          Retrieve Secret
        </a>
      </div>

      <div
        style="margin: 30px 0; padding: 15px; background-color: #451a03; border-left: 4px solid #ea580c; border-radius: 4px;"
      >
        <p style="color: #fdba74; margin: 0; font-size: 14px;">
          ⚠️ <strong>Important Security Information:</strong>
        </p>
        <ul
          style="color: #fdba74; margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;"
        >
          <li>The password was shared through a separate, secure channel</li>
          <li>
            This secret will expire based on the configured retention policy
          </li>
          <li>Never share the password via email or public channels</li>
        </ul>
      </div>

      <p
        style="color: #94a3b8; font-size: 12px; margin: 30px 0 0 0; text-align: center;"
      >
        Powered by CipherShare 🔐
      </p>
    </div>
  </body>
</html>
```

## Testing Email Configuration

### Test SendGrid

```bash
# Set environment variables
export EMAIL_PROVIDER=sendgrid
export EMAIL_FROM=noreply@yourdomain.com
export SENDGRID_API_KEY=your_key_here

# Start the server and create a request
npm run dev

# Submit a secret to trigger email
curl -X POST http://localhost:3001/api/requests/:id/submit \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "test secret",
    "password": "test123"
  }'
```

### Test Mailgun

```bash
# Set environment variables
export EMAIL_PROVIDER=mailgun
export EMAIL_FROM=noreply@yourdomain.com
export MAILGUN_API_KEY=your_key_here
export MAILGUN_DOMAIN=yourdomain.com

# Start the server and create a request
npm run dev

# Submit a secret to trigger email
curl -X POST http://localhost:3001/api/requests/:id/submit \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "test secret",
    "password": "test123"
  }'
```

## Troubleshooting

### SendGrid Issues

**Problem**: "Unauthorized" error

```
Solution: Verify your API key is correct and has Mail Send permission
```

**Problem**: "Sender email not verified"

```
Solution:
1. Go to SendGrid → Settings → Sender Authentication
2. Verify your sender email address
3. Or configure domain authentication
```

**Problem**: Emails in spam folder

```
Solution:
1. Configure domain authentication (SPF, DKIM)
2. Use a professional domain (not Gmail/Yahoo)
3. Warm up your sending domain gradually
```

### Mailgun Issues

**Problem**: "Domain not found" error

```
Solution:
1. Verify MAILGUN_DOMAIN matches your configured domain
2. For testing, use sandbox domain: sandbox123abc.mailgun.org
3. Check domain is verified in Mailgun dashboard
```

**Problem**: "Payment Required" error

```
Solution:
1. Add payment method to Mailgun account
2. Free tier has 3-month limit
3. Consider upgrading to paid plan
```

**Problem**: Emails not arriving

```
Solution:
1. Check DNS records are configured correctly
2. Verify domain in Mailgun dashboard
3. Check Mailgun logs for delivery failures
4. Ensure recipient email is not in suppression list
```

### General Issues

**Problem**: No email sent, no errors

```
Solution:
1. Check EMAIL_PROVIDER is set correctly
2. Verify all required environment variables are set
3. Check server logs for email service initialization
4. Ensure email provider API key is valid
```

**Problem**: Wrong provider being used

```
Solution:
1. Verify EMAIL_PROVIDER environment variable
2. Restart the server after changing environment variables
3. Check server logs for provider initialization message
```

## Switching Providers

### From SendGrid to Mailgun

1. Set up Mailgun account and verify domain
2. Update environment variables:
   ```env
   EMAIL_PROVIDER=mailgun
   MAILGUN_API_KEY=your_mailgun_key
   MAILGUN_DOMAIN=yourdomain.com
   ```
3. Restart the server
4. Test with a secret submission

### From Mailgun to SendGrid

1. Set up SendGrid account and verify sender
2. Update environment variables:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your_sendgrid_key
   ```
3. Restart the server
4. Test with a secret submission

**No code changes required!** The factory pattern handles provider selection automatically.

## Production Best Practices

### 1. Domain Authentication

**Both Providers**: Configure proper domain authentication

- **SPF Record**: Authorize email servers
- **DKIM**: Sign emails cryptographically
- **DMARC**: Define policy for failed authentication

### 2. Monitoring

**SendGrid**: Use built-in analytics dashboard

- Delivery rates
- Open rates (if tracking enabled)
- Bounce rates
- Spam reports

**Mailgun**: Use logs and webhooks

- Configure webhooks for delivery events
- Monitor logs for failures
- Set up alerts for high bounce rates

### 3. Rate Limiting

Both providers have sending limits:

- **SendGrid Free**: 100 emails/day
- **Mailgun Trial**: 5,000 emails/month
- **Production**: Monitor usage and scale plan accordingly

### 4. Error Handling

```typescript
try {
  await emailService.sendRetrievalLink(to, url, desc, ref);
  console.log("✅ Email sent successfully");
} catch (error) {
  console.error("❌ Email sending failed:", error);
  // Implement retry logic or fallback notification method
}
```

### 5. Fallback Strategy

Consider implementing a fallback provider:

```typescript
try {
  await primaryEmailService.sendRetrievalLink(...);
} catch (error) {
  console.warn('Primary email provider failed, trying fallback...');
  await fallbackEmailService.sendRetrievalLink(...);
}
```

## Cost Considerations

### SendGrid Pricing (as of 2024)

- **Free**: 100 emails/day
- **Essentials**: $19.95/mo (50K emails)
- **Pro**: $89.95/mo (1.5M emails)

### Mailgun Pricing (as of 2024)

- **Trial**: 5,000 emails/month (3 months)
- **Foundation**: $35/mo (50K emails)
- **Growth**: $80/mo (100K emails)

**Recommendation**:

- Start with SendGrid for simplicity
- Switch to Mailgun for better economics at scale
- Use environment variable to make switching seamless

## Security Considerations

### API Key Protection

```bash
# Never commit API keys to version control
echo ".env" >> .gitignore

# Use environment variables in production
# AWS: Parameter Store, Secrets Manager
# Azure: Key Vault
# Google Cloud: Secret Manager
```

### Email Content Security

- ✅ Secrets are never included in email content
- ✅ Only URLs are sent (encrypted IDs)
- ✅ Passwords shared through separate channel
- ✅ HTML content is properly sanitized

### Sender Reputation

- Use dedicated IP for high-volume sending
- Monitor bounce rates and spam complaints
- Implement double opt-in for user-generated content
- Maintain proper list hygiene

## References

- [SendGrid API Documentation](https://docs.sendgrid.com/)
- [Mailgun API Documentation](https://documentation.mailgun.com/)
- [Email Authentication Best Practices](https://www.cloudflare.com/learning/email-security/)
- [SMTP vs API Sending](https://www.mailgun.com/blog/smtp-api/)
