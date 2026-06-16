export class Msg91Provider {
  async send(phone, message) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey || !templateId) {
      return {
        success: false,
        error: 'MSG91 provider credentials (MSG91_AUTH_KEY or MSG91_TEMPLATE_ID) are missing in server environment.'
      };
    }

    try {
      const otpCode = message.match(/\d{6}/)?.[0] || '';

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          template_id: templateId,
          recipients: [
            {
              mobiles: phone,
              otp: otpCode,
              message: message
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok || data.type === 'error') {
        return {
          success: false,
          error: data.message || `MSG91 Flow API Error (Status ${response.status})`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Unknown network error occurred during MSG91 dispatch.'
      };
    }
  }
}
