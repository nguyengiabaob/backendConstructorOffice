import "twilio";
import { Twilio } from "twilio";
import GeneralFunction from "../utils/GeneralFucntion";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new Twilio(accountSid, authToken);

class TwilioService {
  static sendVerificationCode = async (phoneNumber: string, code: number) => {
    try {
      const message = await client.messages.create({
        body: `Your verification code is ${code}. Do not share it with anyone!`,
        from: GeneralFunction.formatVNPhone(
          process.env.TWILIO_PHONE_NUMBER?.toString() ?? "",
        ),
        to: GeneralFunction.formatVNPhone(phoneNumber),
      });
      console.log(message);
      return true;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
}

export { TwilioService };
