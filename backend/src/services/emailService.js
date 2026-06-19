import nodemailer from "nodemailer";

// ==========================================
// NODEMAILER GMAIL SMTP TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

// ==========================================
// EMAIL VALIDATION HELPER
// ==========================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailFormat(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

// ==========================================
// STARTUP SMTP VERIFICATION
// ==========================================

export async function validateEmailConfig() {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_APP_PASSWORD?.trim();

  if (!emailUser || !emailPass) {
    console.error("✗ EMAIL_USER or EMAIL_APP_PASSWORD is missing.");
    console.log(
      "  Please set EMAIL_USER and EMAIL_APP_PASSWORD environment variables.",
    );
    console.log(
      "  For Gmail, generate an App Password at: https://myaccount.google.com/apppasswords",
    );
    // Do NOT crash the server — just warn
    return;
  }

  try {
    await transporter.verify();
    console.log("SMTP Connected Successfully");
  } catch (error) {
    console.error("✗ SMTP verification failed.");
    console.error("  Error Code:", error.code || "UNKNOWN");
    console.error("  Error Message:", error.message);
    console.error("  Response:", error.response || "N/A");
    console.error("  Host:", "smtp.gmail.com");
    console.error("  Port:", 465);
    console.error("  EMAIL_USER set:", !!emailUser);
    console.error("  EMAIL_APP_PASSWORD set:", !!emailPass);
    // Do NOT crash the server — the API will return errors on send attempts
  }
}

// ==========================================
// RETRY HELPER
// ==========================================

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// SEND OTP EMAIL (with retry logic)
// ==========================================

export async function sendOtpEmail(toEmail, otpCode) {
  // 1. Validate email format
  if (!validateEmailFormat(toEmail)) {
    console.error(
      `[Email Service] Invalid email format: "${toEmail}"`,
    );
    return {
      success: false,
      error: "Invalid email address format.",
      code: "INVALID_EMAIL",
    };
  }

  // 2. Build email content
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #edf2f7; padding-bottom: 24px;">
        <span style="font-size: 28px; font-weight: 800; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; color: #2563eb; letter-spacing: -0.5px;"> Returno</span>
        <p style="color: #718096; font-size: 13px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Secure Login Session</p>
      </div>
      <div style="padding: 10px 0;">
        <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #2d3748; letter-spacing: -0.3px;">Your One-Time Password</h2>
        <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin-bottom: 24px;">Please use the verification code below to log in or register for your Returno account. This code is valid for <strong>5 minutes</strong>.</p>
        
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

  const mailOptions = {
    from: `"Returno Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Returno Verification Code: ${otpCode}`,
    html: htmlContent,
  };

  // 3. Retry logic: up to 3 attempts, 2s wait between retries
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[Email Service] Attempt ${attempt}/${MAX_RETRIES} — Sending OTP to "${toEmail}"...`,
      );

      const info = await transporter.sendMail(mailOptions);

      console.log(
        `[Email Service] Email sent successfully. MessageId: ${info.messageId}`,
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(
        `[Email Service] Attempt ${attempt}/${MAX_RETRIES} FAILED:`,
        error.message,
      );

      // Classify the error
      const errorCode = classifySmtpError(error);

      // If it's an auth failure, don't retry — credentials won't change
      if (errorCode === "SMTP_AUTH_FAILED") {
        console.error(
          "[Email Service] Authentication failed. Skipping remaining retries.",
        );
        return {
          success: false,
          error: "SMTP authentication failed. Check EMAIL_USER and EMAIL_APP_PASSWORD.",
          code: "SMTP_AUTH_FAILED",
        };
      }

      // Wait before retrying (except on the last attempt)
      if (attempt < MAX_RETRIES) {
        console.log(
          `[Email Service] Waiting ${RETRY_DELAY_MS}ms before retry...`,
        );
        await delay(RETRY_DELAY_MS);
      } else {
        // Last attempt failed
        return {
          success: false,
          error: error.message || "Failed to send email after all retries.",
          code: errorCode,
        };
      }
    }
  }

  // Fallback (should not reach here)
  return {
    success: false,
    error: "Unexpected error in email send loop.",
    code: "EMAIL_SEND_FAILED",
  };
}

// ==========================================
// SMTP ERROR CLASSIFIER
// ==========================================

function classifySmtpError(error) {
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";
  const responseCode = error.responseCode;

  // Authentication failures
  if (
    responseCode === 535 ||
    msg.includes("invalid login") ||
    msg.includes("authentication") ||
    msg.includes("auth") ||
    code === "EAUTH"
  ) {
    return "SMTP_AUTH_FAILED";
  }

  // Connection failures
  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    msg.includes("connect") ||
    msg.includes("timeout")
  ) {
    return "SMTP_CONNECTION_FAILED";
  }

  // Everything else
  return "EMAIL_SEND_FAILED";
}

// ==========================================
// DIAGNOSTIC: SMTP STATUS CHECK
// ==========================================

export async function getSmtpDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    smtp: {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    },
    environment: {
      EMAIL_USER_SET: !!process.env.EMAIL_USER?.trim(),
      EMAIL_APP_PASSWORD_SET: !!process.env.EMAIL_APP_PASSWORD?.trim(),
      NODE_ENV: process.env.NODE_ENV || "not set",
      PORT: process.env.PORT || "not set",
    },
    connection: {
      status: "unknown",
      error: null,
    },
  };

  try {
    await transporter.verify();
    diagnostics.connection.status = "connected";
  } catch (error) {
    diagnostics.connection.status = "failed";
    diagnostics.connection.error = {
      code: error.code || "UNKNOWN",
      message: error.message,
      responseCode: error.responseCode || null,
    };
  }

  return diagnostics;
}
