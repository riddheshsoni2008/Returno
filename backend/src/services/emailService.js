export async function validateEmailConfig() {
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!resendKey || resendKey.includes("placeholder")) {
    console.error("✗ RESEND_API_KEY is missing or set to placeholder.");
    console.log("Please get a free API key from resend.com and add it to Render.");
    process.exit(1);
  } else {
    console.log("✓ RESEND_API_KEY loaded");
    console.log("✓ Email service configured successfully with Resend API");
  }
}

export async function sendOtpEmail(toEmail, otpCode) {
  try {
    console.log(
      `[Email Service] Starting OTP email delivery process. toEmail parameter: "${toEmail}"`,
    );

    console.log(`[Email Service] Sending mail via Resend API to: "${toEmail}"...`);
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Returno Security <onboarding@resend.dev>",
        to: [toEmail],
        subject: `Your Returno Verification Code: ${otpCode}`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[Email Service] Resend API Error:`, data);
      return {
        success: false,
        error: "Failed to send email via Resend API. Check your API key.",
      };
    }

    console.log(`[Email Service] Resend Response: SUCCESS. ID: ${data.id}`);
    return { success: true };
  } catch (error) {
    console.error("[Email Service] Error occurred during sendMail execution:", error.stack || error);
    return {
      success: false,
      error: error.message || "Error occurred while sending verification email.",
    };
  }
}
