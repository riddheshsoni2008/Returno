import nodemailer from 'nodemailer';

export function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  const isPlaceholder = (val) => {
    if (!val) return true;
    const lower = val.toLowerCase();
    return (
      lower.includes('placeholder') ||
      lower.includes('your_email') ||
      lower.includes('your_email_password') ||
      lower.includes('your_google_app_password') ||
      lower.includes('example@gmail.com') ||
      lower.includes('email_password_env')
    );
  };

  if (!user || !pass || isPlaceholder(user) || isPlaceholder(pass)) {
    throw new Error('EMAIL_USER and EMAIL_PASSWORD are not configured or are set to placeholder values. Please define your actual Gmail App credentials in .env.local.');
  }

  // Enforce Gmail App Password authentication
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

export async function sendOtpEmail(toEmail, otpCode) {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_USER;

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #edf2f7; padding-bottom: 24px;">
          <span style="font-size: 28px; font-weight: 800; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; color: #2563eb; letter-spacing: -0.5px;">✨ Returno</span>
          <p style="color: #718096; font-size: 13px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Secure Login Session</p>
        </div>
        <div style="padding: 10px 0;">
          <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #2d3748; letter-spacing: -0.3px;">Your One-Time Password</h2>
          <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin-bottom: 24px;">Please use the verification code below to log in or register for your Returno account. This code is valid for **5 minutes**.</p>
          
          <div style="text-align: center; margin: 36px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1a202c; background-color: #edf2f7; padding: 16px 32px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: Courier, monospace;">
              ${otpCode}
            </div>
          </div>
          
          <p style="font-size: 12px; color: #e53e3e; margin: 0; font-weight: 600; text-align: center;">If you did not request this, please ignore this message. Never share this code with anyone.</p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 24px; margin-top: 32px;">
          &copy; 2026 Returno Platform. All rights reserved.
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Returno Security" <${fromAddress}>`,
      to: toEmail,
      subject: `Your Returno Verification Code: ${otpCode}`,
      text: `Your Returno verification code is ${otpCode}. Valid for 5 minutes.`,
      html: htmlContent
    });

    console.log(`[Email Service] OTP successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error('Email Service Error sending mail:', error);
    return {
      success: false,
      error: error.message || 'Error occurred while sending verification email.'
    };
  }
}
