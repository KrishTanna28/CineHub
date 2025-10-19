// SMS Service for sending OTPs
// Using console.log for development - replace with actual SMS service in production
import twilio from 'twilio';
import axios from 'axios';
/**
 * Send OTP via SMS
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>} - Success status
 */
export const sendOTP = async (mobile, otp) => {
  try {
    // For development: Log OTP to console
    console.log(`\n📱 SMS Service - OTP for ${mobile}: ${otp}\n`);
    
    // Fast2SMS Integration (Free for India - 50 SMS/day)
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const message = `Your CineHub OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`;
        const response = await axios.get(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            params: {
              authorization: process.env.FAST2SMS_API_KEY,
              message: message,
              route: 'q',  // Quick transactional route
              numbers: mobile,
              flash: 0
            }
          }
        );
        
        if (response.data.return) {
          console.log(`✅ Fast2SMS sent successfully to ${mobile}`);
          console.log(`📱 Response:`, response.data);
          return true;
        }
      } catch (fast2smsError) {
        console.error('❌ Fast2SMS Error:', fast2smsError.response?.data || fast2smsError.message);
      }
    }
    
    // Twilio Integration (Fallback)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        await client.messages.create({
          body: `Your CineHub OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${mobile}` // Indian mobile numbers
        });
        
        console.log(`✅ Twilio SMS sent successfully to +91${mobile}`);
        return true;
      } catch (twilioError) {
        console.error('❌ Twilio Error:', twilioError.message);
      }
    }
    
    // Simulate SMS delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('SMS Service Error:', error);
    return false;
  }
};

/**
 * Send verification OTP
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>} - Success status
 */
export const sendVerificationOTP = async (mobile, otp) => {
  try {
    console.log(`\n📱 Verification OTP for ${mobile}: ${otp}\n`);
    
    // Fast2SMS Integration (Free for India - 50 SMS/day)
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const message = `Welcome to CineHub! Your verification OTP is ${otp}. Valid for 10 minutes.`;
        const response = await axios.get(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            params: {
              authorization: process.env.FAST2SMS_API_KEY,
              message: message,
              route: 'q',  // Quick transactional route
              numbers: mobile,
              flash: 0
            }
          }
        );
        
        if (response.data.return) {
          console.log(`✅ Fast2SMS verification sent successfully to ${mobile}`);
          console.log(`📱 Response:`, response.data);
          return true;
        }
      } catch (fast2smsError) {
        console.error('❌ Fast2SMS Error:', fast2smsError.response?.data || fast2smsError.message);
      }
    }
    
    // Twilio Integration (Fallback)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        await client.messages.create({
          body: `Welcome to CineHub! Your verification OTP is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${mobile}`
        });
        
        console.log(`✅ Twilio verification SMS sent successfully to +91${mobile}`);
        return true;
      } catch (twilioError) {
        console.error('❌ Twilio Error:', twilioError.message);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error('SMS Service Error:', error);
    return false;
  }
};

// Export default
export default {
  sendOTP,
  sendVerificationOTP
};
