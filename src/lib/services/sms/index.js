import { TwilioProvider } from './TwilioProvider';
import { Msg91Provider } from './Msg91Provider';
import { AwsSnsProvider } from './AwsSnsProvider';

export function getSmsProvider() {
  const providerType = process.env.SMS_PROVIDER;

  if (!providerType) {
    throw new Error('SMS_PROVIDER environment variable is not defined. Please configure a production SMS gateway (twilio, msg91, aws_sns) in your env.');
  }

  switch (providerType.toLowerCase()) {
    case 'twilio':
      return new TwilioProvider();
    case 'msg91':
      return new Msg91Provider();
    case 'aws_sns':
    case 'aws-sns':
    case 'aws':
      return new AwsSnsProvider();
    default:
      throw new Error(`Unsupported SMS provider "${providerType}". Please configure a valid production gateway: 'twilio', 'msg91', or 'aws_sns'.`);
  }
}
