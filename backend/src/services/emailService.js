// ==========================================
// BREVO HTTP API EMAIL SERVICE
// ==========================================
// Uses Brevo (formerly Sendinblue) free tier HTTP API.
// 300 emails/day, no personal domain needed, works on Render.
// SMTP ports are BLOCKED on Render free tier — this uses HTTP instead.

// ==========================================
// EMAIL VALIDATION HELPER
// ==========================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailFormat(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

// ==========================================
// STARTUP VALIDATION
// ==========================================

export async function validateEmailConfig() {
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.SENDER_EMAIL?.trim();
  const senderName = process.env.SENDER_NAME?.trim() || "Returno";

  if (!brevoKey) {
    console.error("✗ BREVO_API_KEY is missing.");
    console.log("  Sign up free at https://app.brevo.com → Settings → SMTP & API → API Keys");
    console.log("  Add BREVO_API_KEY to your Render environment variables.");
    return;
  }

  if (!senderEmail) {
    console.error("✗ SENDER_EMAIL is missing.");
    console.log("  Set SENDER_EMAIL to the email address you verified on Brevo.");
    return;
  }

  // Verify the API key works by calling Brevo account endpoint
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      console.log("✓ Brevo API Connected Successfully");
      console.log(`  Account: ${data.email || "OK"}`);
      console.log(`  Plan: ${data.plan?.[0]?.type || "Free"}`);
      console.log(`  Sender: ${senderName} <${senderEmail}>`);
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("✗ Brevo API key verification failed.");
      console.error("  Status:", res.status);
      console.error("  Error:", errData.message || "Invalid API key");
    }
  } catch (error) {
    console.error("✗ Brevo API connectivity check failed:", error.message);
    // Don't crash — emails might still work
  }
}

// ==========================================
// RETRY HELPER
// ==========================================

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// OTP EMAIL HTML TEMPLATE
// ==========================================

function buildOtpHtml(otpCode) {
  return `
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
}

// ==========================================
// SEND OTP EMAIL (Brevo HTTP API + retry)
// ==========================================

export async function sendOtpEmail(toEmail, otpCode) {
  // 1. Validate email format
  if (!validateEmailFormat(toEmail)) {
    console.error(`[Email Service] Invalid email format: "${toEmail}"`);
    return {
      success: false,
      error: "Invalid email address format.",
      code: "INVALID_EMAIL",
    };
  }

  // 2. Check API key exists
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  if (!brevoKey) {
    console.error("[Email Service] BREVO_API_KEY is not set.");
    return {
      success: false,
      error: "Email service not configured. Missing BREVO_API_KEY.",
      code: "EMAIL_NOT_CONFIGURED",
    };
  }

  const senderEmail = process.env.SENDER_EMAIL?.trim();
  const senderName = process.env.SENDER_NAME?.trim() || "Returno";

  if (!senderEmail) {
    console.error("[Email Service] SENDER_EMAIL is not set.");
    return {
      success: false,
      error: "Email service not configured. Missing SENDER_EMAIL.",
      code: "EMAIL_NOT_CONFIGURED",
    };
  }

  // 3. Build request payload for Brevo v3 API
  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: toEmail,
      },
    ],
    subject: `Your Returno Verification Code: ${otpCode}`,
    htmlContent: buildOtpHtml(otpCode),
  };

  // 4. Retry logic: up to 3 attempts, 2s wait between retries
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[Email Service] Attempt ${attempt}/${MAX_RETRIES} — Sending OTP to "${toEmail}" via Brevo API...`,
      );

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        console.log(
          `[Email Service] Email sent successfully. MessageId: ${data.messageId || "OK"}`,
        );
        return { success: true, messageId: data.messageId };
      }

      // Handle specific Brevo error codes
      console.error(
        `[Email Service] Attempt ${attempt}/${MAX_RETRIES} FAILED. Status: ${res.status}`,
      );
      console.error(`[Email Service] Brevo Error:`, data);

      const errorCode = classifyBrevoError(res.status, data);

      // Auth failures won't fix on retry
      if (errorCode === "SMTP_AUTH_FAILED") {
        console.error(
          "[Email Service] API key invalid. Skipping remaining retries.",
        );
        return {
          success: false,
          error: "Brevo API authentication failed. Check BREVO_API_KEY.",
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
        return {
          success: false,
          error: data.message || "Failed to send email after all retries.",
          code: errorCode,
        };
      }
    } catch (error) {
      console.error(
        `[Email Service] Attempt ${attempt}/${MAX_RETRIES} FAILED (network):`,
        error.message,
      );

      if (attempt < MAX_RETRIES) {
        console.log(
          `[Email Service] Waiting ${RETRY_DELAY_MS}ms before retry...`,
        );
        await delay(RETRY_DELAY_MS);
      } else {
        return {
          success: false,
          error: error.message || "Failed to send email after all retries.",
          code: "SMTP_CONNECTION_FAILED",
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
// BREVO ERROR CLASSIFIER
// ==========================================

function classifyBrevoError(statusCode, data) {
  // 401 = unauthorized (bad API key)
  if (statusCode === 401) {
    return "SMTP_AUTH_FAILED";
  }

  // 403 = forbidden (account suspended, sender not verified)
  if (statusCode === 403) {
    return "SMTP_AUTH_FAILED";
  }

  // 5xx = server error, network issue
  if (statusCode >= 500) {
    return "SMTP_CONNECTION_FAILED";
  }

  // 429 = rate limit
  if (statusCode === 429) {
    return "EMAIL_SEND_FAILED";
  }

  // Everything else
  return "EMAIL_SEND_FAILED";
}

// ==========================================
// DIAGNOSTIC: EMAIL SERVICE STATUS CHECK
// ==========================================

export async function getEmailDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    provider: "Brevo (HTTP API)",
    endpoint: "https://api.brevo.com/v3/smtp/email",
    environment: {
      BREVO_API_KEY_SET: !!process.env.BREVO_API_KEY?.trim(),
      SENDER_EMAIL_SET: !!process.env.SENDER_EMAIL?.trim(),
      SENDER_NAME: process.env.SENDER_NAME?.trim() || "Returno (default)",
      NODE_ENV: process.env.NODE_ENV || "not set",
      PORT: process.env.PORT || "not set",
    },
    connection: {
      status: "unknown",
      error: null,
      account: null,
    },
  };

  const brevoKey = process.env.BREVO_API_KEY?.trim();
  if (!brevoKey) {
    diagnostics.connection.status = "not_configured";
    diagnostics.connection.error = "BREVO_API_KEY is not set";
    return diagnostics;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      diagnostics.connection.status = "connected";
      diagnostics.connection.account = {
        email: data.email,
        plan: data.plan?.[0]?.type || "Free",
        credits: data.plan?.[0]?.credits || "N/A",
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      diagnostics.connection.status = "auth_failed";
      diagnostics.connection.error = errData.message || `HTTP ${res.status}`;
    }
  } catch (error) {
    diagnostics.connection.status = "network_error";
    diagnostics.connection.error = error.message;
  }

  return diagnostics;
}
