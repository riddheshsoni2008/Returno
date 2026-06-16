export class AwsSnsProvider {
  async send(phone, message) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      return {
        success: false,
        error: 'AWS credentials (AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY) are missing in server environment.'
      };
    }

    try {
      let SNSClient, PublishCommand;
      try {
        const snsModule = eval('require')('@aws-sdk/client-sns');
        SNSClient = snsModule.SNSClient;
        PublishCommand = snsModule.PublishCommand;
      } catch (err) {
        return {
          success: false,
          error: 'AWS SDK is not installed on this server. Run: npm install @aws-sdk/client-sns'
        };
      }

      const client = new SNSClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      });

      const command = new PublishCommand({
        PhoneNumber: `+${phone}`,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      });

      const response = await client.send(command);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error occurred during AWS SNS publish.'
      };
    }
  }
}
