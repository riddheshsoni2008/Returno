export class TwilioProvider {
  async send(phone, message) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        error: 'Twilio provider credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER) are missing in server environment.'
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const body = new URLSearchParams({
        To: `+${phone}`,
        From: fromNumber,
        Body: message
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Twilio REST API Error (Status ${response.status})`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Unknown network error occurred during Twilio dispatch.'
      };
    }
  }
}
