import nodemailer from "nodemailer";

export async function getTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  let pass = process.env.EMAIL_PASSWORD?.trim();

  // If EMAIL_PASSWORD is set to the name of the env variable, resolve it
  if (pass === "EMAIL_PASSWORD_ENV") {
    pass = process.env.EMAIL_PASSWORD_ENV?.trim();
  }

  // Strip spaces from EMAIL_PASSWORD automatically
  const cleanedPass = pass?.replace(/\s+/g, "");

  const isPlaceholder = (val) => {
    if (!val) return true;
    const lower = val.toLowerCase();
    return (
      lower.includes("placeholder") ||
      lower.includes("your_email") ||
      lower.includes("your_email_password") ||
      lower.includes("your_google_app_password") ||
      lower.includes("example@gmail.com") ||
      lower.includes("email_password_env")
    );
  };

  if (
    !user ||
    !cleanedPass ||
    isPlaceholder(user) ||
    isPlaceholder(cleanedPass)
  ) {
    throw new Error(
      "Email SMTP credentials are not configured or are set to placeholders. Please configure EMAIL_USER and EMAIL_PASSWORD in backend/.env file.",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: cleanedPass,
    },
  });
}

export async function validateEmailConfig() {
  const user = process.env.EMAIL_USER?.trim();
  let pass = process.env.EMAIL_PASSWORD?.trim();
  const cleanedPass = pass?.replace(/\s+/g, "");

  if (pass === "EMAIL_PASSWORD_ENV") {
    pass = process.env.EMAIL_PASSWORD_ENV?.trim();
  }

  const isPlaceholder = (val) => {
    if (!val) return true;
    const lower = val.toLowerCase();
    return (
      lower.includes("placeholder") ||
      lower.includes("your_email") ||
      lower.includes("your_email_password") ||
      lower.includes("your_google_app_password") ||
      lower.includes("example@gmail.com") ||
      lower.includes("email_password_env")
    );
  };

  if (!user || isPlaceholder(user)) {
    console.error("✗ EMAIL_USER is missing or set to placeholder.");
    process.exit(1);
  } else {
    console.log("✓ EMAIL_USER loaded");
  }

  if (!pass || isPlaceholder(pass)) {
    console.error("✗ EMAIL_PASSWORD is missing or set to placeholder.");
    process.exit(1);
  } else {
    console.log("✓ EMAIL_PASSWORD loaded");
  }

  // Verify SMTP Connection to fail fast on startup
  try {
    const transporter = await getTransporter();

    await transporter.verify();
    console.log("✓ SMTP connected successfully");
  } catch (error) {
    console.error("✗ FULL SMTP ERROR");
    console.error(error);
    console.error("CODE:", error.code);
    console.error("COMMAND:", error.command);
    console.error("ADDRESS:", error.address);
    console.error("PORT:", error.port);
  }
}

export async function sendOtpEmail(toEmail, otpCode) {
  try {
    console.log(
      `[Email Service] Starting OTP email delivery process. toEmail parameter: "${toEmail}"`,
    );

    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_USER || "no-reply@returno.app";

    console.log(
      `[Email Service] SMTP Transporter initialized. Sender address: "${fromAddress}", Recipient (toEmail): "${toEmail}"`,
    );

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

    console.log(
      `[Email Service] Sending mail via Nodemailer to: "${toEmail}"...`,
    );
    const info = await transporter.sendMail({
      from: `"Returno Security" <${fromAddress}>`,
      to: toEmail,
      subject: `Your Returno Verification Code: ${otpCode}`,
      text: `Your Returno verification code is ${otpCode}. Valid for 5 minutes.`,
      html: htmlContent,
    });

    const accepted = info.accepted || [];
    const rejected = info.rejected || [];
    const response = info.response || "";

    console.log(`[Email Service] Nodemailer Response: SUCCESS.`);
    console.log(`[Email Service] MessageId: ${info.messageId}`);
    console.log(`[Email Service] Recipient Email:`, toEmail);
    console.log(`[Email Service] Accepted Recipients:`, accepted);
    console.log(`[Email Service] Rejected Recipients:`, rejected);
    console.log(`[Email Service] SMTP Response:`, response);

    const normalizedToEmail = toEmail.toLowerCase().trim();
    const isAccepted = accepted.some(
      (email) => email.toLowerCase().trim() === normalizedToEmail,
    );
    const isRejected = rejected.some(
      (email) => email.toLowerCase().trim() === normalizedToEmail,
    );
    const hasSmtpError = response && /^[45]\d{2}/.test(response.trim());

    if (isRejected || !isAccepted || hasSmtpError) {
      console.error(
        `[Email Service] Delivery validation failed. isAccepted: ${isAccepted}, isRejected: ${isRejected}, hasSmtpError: ${hasSmtpError}`,
      );
      return {
        success: false,
        error:
          "This email address does not exist or cannot receive emails. Please check and try again.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "[Email Service] Error occurred during sendMail execution:",
      error.stack || error,
    );
    console.log(`[Email Service] Recipient Email:`, toEmail);
    if (error.accepted) {
      console.log(
        `[Email Service] Accepted Recipients (from error):`,
        error.accepted,
      );
    } else {
      console.log(`[Email Service] Accepted Recipients: None`);
    }
    if (error.rejected) {
      console.log(
        `[Email Service] Rejected Recipients (from error):`,
        error.rejected,
      );
    } else {
      console.log(`[Email Service] Rejected Recipients: None`);
    }
    if (error.response) {
      console.log(
        `[Email Service] SMTP Response (from error): "${error.response}"`,
      );
    } else {
      console.log(`[Email Service] SMTP Response: None`);
    }

    const errText = (error.message || "").toLowerCase();
    const isRecipientError =
      error.code === "EENVELOPE" ||
      errText.includes("550") ||
      errText.includes("553") ||
      errText.includes("501") ||
      errText.includes("554") ||
      errText.includes("does not exist") ||
      errText.includes("invalid address") ||
      errText.includes("recipient") ||
      errText.includes("mailbox");

    if (isRecipientError) {
      return {
        success: false,
        error:
          "This email address does not exist or cannot receive emails. Please check and try again.",
      };
    }

    return {
      success: false,
      error:
        error.message || "Error occurred while sending verification email.",
    };
  }
}
