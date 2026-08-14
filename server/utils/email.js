import { config } from '../config.js';
import { sendSmtpEmail } from './smtpClient.js';

/**
 * Universal Email Sender Helper.
 * Tries SMTP, Brevo, Resend, or SendGrid based on .env settings.
 */
async function dispatchEmail({ toEmail, subject, htmlContent }) {
  // 1. Check Native SMTP (Gmail / Custom SMTP)
  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    try {
      const cleanPass = config.smtpPass.replace(/\s+/g, '');
      await sendSmtpEmail({
        host: config.smtpHost,
        port: config.smtpPort || 465,
        user: config.smtpUser,
        pass: cleanPass,
        from: config.emailFrom || config.smtpUser,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`\n📧 [SMTP EMAIL SENT] Dispatched to ${toEmail}`);
      return true;
    } catch (smtpErr) {
      console.warn('⚠️ SMTP Email dispatch error:', smtpErr.message);
    }
  }

  // 2. Check Brevo / Sendinblue HTTP API
  if (config.brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': config.brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'AgroLink Portal', email: config.emailFrom || 'noreply@agrolink.gh' },
          to: [{ email: toEmail }],
          subject,
          htmlContent,
        }),
      });
      if (res.ok) {
        console.log(`\n📧 [BREVO EMAIL SENT] Dispatched to ${toEmail}`);
        return true;
      }
    } catch (err) {
      console.warn('Brevo email API error:', err.message);
    }
  }

  // 3. Check Resend API
  if (config.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.emailFrom || 'AgroLink Portal <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlContent,
        }),
      });
      if (res.ok) {
        console.log(`\n📧 [RESEND EMAIL SENT] Dispatched to ${toEmail}`);
        return true;
      }
    } catch (err) {
      console.warn('Resend email API error:', err.message);
    }
  }

  // 4. Check SendGrid API
  if (config.sendgridApiKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: config.emailFrom || 'security@agrolink.gh', name: 'AgroLink Portal' },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });
      if (res.ok) {
        console.log(`\n📧 [SENDGRID EMAIL SENT] Dispatched to ${toEmail}`);
        return true;
      }
    } catch (err) {
      console.warn('SendGrid email API error:', err.message);
    }
  }

  // Fallback log to console if no email service is configured in .env yet
  console.log(`\n📧 [EMAIL DISPATCH LOG TO ${toEmail}]`);
  console.log(`Subject: ${subject}`);
  console.log(`(Configure SMTP_USER & SMTP_PASS in server/.env for live inbox delivery!)\n`);

  return true;
}

/**
 * Send password reset verification code email.
 */
export async function sendPasswordResetEmail(toEmail, code) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #1c3322; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .logo { font-size: 24px; font-weight: 800; color: #2e7d32; display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
        h2 { color: #1c3322; font-size: 20px; margin-top: 0; }
        p { font-size: 15px; line-height: 1.6; color: #4a5568; }
        .code-box { background: #f0fdf4; border: 2px dashed #2e7d32; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
        .code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2e7d32; }
        .footer { font-size: 12px; color: #a0aec0; margin-top: 32px; text-align: center; border-top: 1px solid #edf2f7; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🌱 AgroLink Security</div>
        <h2>Password Reset Security Code</h2>
        <p>Hello,</p>
        <p>You recently requested a password reset for your AgroLink account. Please use the following 6-digit security code to verify your identity:</p>
        
        <div class="code-box">
          <div class="code">${code}</div>
        </div>

        <p>This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or secure your account.</p>
        
        <div class="footer">
          © 2026 AgroLink Portal. Safe & Secure Agriculture Portal.
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({
    toEmail,
    subject: '🔒 AgroLink Password Reset Verification Code',
    htmlContent,
  });
}

/**
 * Send welcome email to newly created user accounts.
 */
export async function sendWelcomeEmail(toEmail, userName, role = 'farmer') {
  const isFarmer = role?.toLowerCase() === 'farmer';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #1c3322; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header-banner { background: linear-gradient(135deg, #1b4332, #2d6a4f); padding: 24px; border-radius: 10px 10px 0 0; color: #ffffff; text-align: center; margin: -32px -32px 24px -32px; }
        .logo { font-size: 26px; font-weight: 800; color: #ffffff; margin-bottom: 6px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        h2 { color: #1c3322; font-size: 20px; margin-top: 0; }
        p { font-size: 15px; line-height: 1.6; color: #4a5568; }
        .features-list { background: #f8fafc; border-radius: 8px; padding: 18px; margin: 20px 0; border-left: 4px solid #2e7d32; }
        .features-list li { margin-bottom: 8px; font-size: 14px; color: #334155; }
        .cta-btn { display: inline-block; background: #2e7d32; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; margin-top: 16px; text-align: center; }
        .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header-banner">
          <div class="logo">🌱 Welcome to AgroLink</div>
          <div class="subtitle">Empowering Modern Agriculture & Trade</div>
        </div>

        <h2>Welcome aboard, ${userName}!</h2>
        <p>Thank you for creating an account on <strong>AgroLink</strong>. We're excited to have you join our growing agricultural ecosystem.</p>

        <div class="features-list">
          <p style="margin-top: 0; font-weight: 700; color: #1c3322;">Here is what you can do next:</p>
          <ul>
            ${isFarmer ? `
              <li>🌾 <strong>List Your Produce:</strong> Add crops and machinery listings to reach buyers nationwide.</li>
              <li>⚡ <strong>Manage Your Shop:</strong> Customize your farmer storefront and run promotional deals.</li>
              <li>💬 <strong>Direct Buyer Chat:</strong> Negotiate bulk orders and connect directly with verified buyers.</li>
            ` : `
              <li>🛒 <strong>Browse Marketplace:</strong> Discover fresh organic produce and agricultural supplies.</li>
              <li>🤝 <strong>Bulk Purchases:</strong> Submit wholesale bid proposals to verified farmers.</li>
              <li>⚡ <strong>Real-Time Chat:</strong> Connect directly with sellers and track your orders.</li>
            `}
          </ul>
        </div>

        <p>If you have any questions or need assistance setting up your profile, our team is always here to help.</p>

        <div style="text-align: center;">
          <a href="http://localhost:5173" class="cta-btn">Access Your Dashboard</a>
        </div>

        <div class="footer">
          © 2026 AgroLink Portal. Smart Agriculture & Direct Farm Trade.
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({
    toEmail,
    subject: `🎉 Welcome to AgroLink, ${userName}!`,
    htmlContent,
  });
}
