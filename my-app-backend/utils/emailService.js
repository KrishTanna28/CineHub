// Email Service for sending OTPs
import nodemailer from 'nodemailer';

/**
 * Send OTP via Email
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 * @param {string} userName - User's name
 * @returns {Promise<boolean>} - Success status
 */
export const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {

    // Gmail SMTP Configuration (FREE)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        // Create transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD // App password, not regular password
          }
        });

        // Email content
        const mailOptions = {
          from: `"CineHub" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: '🎬 Your CineHub Verification Code',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6; 
                  background-color: #141414;
                  color: #f2f2f2;
                  padding: 20px;
                }
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: #1f1f1f;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }
                .header { 
                  background: linear-gradient(135deg, #141414 0%, #1f1f1f 100%);
                  padding: 40px 30px;
                  text-align: center;
                  border-bottom: 3px solid #f4c430;
                }
                .logo { 
                  font-size: 36px; 
                  font-weight: 800; 
                  color: #f4c430;
                  margin-bottom: 8px;
                  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                .tagline { 
                  color: #b3b3b3; 
                  font-size: 14px;
                  letter-spacing: 1px;
                }
                .content { 
                  padding: 40px 30px;
                  background: #1f1f1f;
                }
                .greeting { 
                  font-size: 24px; 
                  font-weight: 600; 
                  color: #f2f2f2;
                  margin-bottom: 20px;
                }
                .message { 
                  color: #b3b3b3; 
                  margin-bottom: 30px;
                  font-size: 16px;
                }
                .otp-box { 
                  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                  border: 2px solid #f4c430;
                  border-radius: 12px;
                  padding: 30px;
                  text-align: center;
                  margin: 30px 0;
                  box-shadow: 0 4px 20px rgba(244, 196, 48, 0.1);
                }
                .otp-label { 
                  color: #b3b3b3; 
                  font-size: 12px;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                  margin-bottom: 15px;
                }
                .otp-code { 
                  font-size: 42px; 
                  font-weight: 800; 
                  color: #f4c430;
                  letter-spacing: 12px;
                  text-shadow: 0 0 20px rgba(244, 196, 48, 0.3);
                  margin: 15px 0;
                }
                .otp-expiry { 
                  color: #808080; 
                  font-size: 13px;
                  margin-top: 15px;
                }
                .warning { 
                  background: rgba(244, 196, 48, 0.1);
                  border-left: 4px solid #f4c430;
                  padding: 20px;
                  margin: 30px 0;
                  border-radius: 8px;
                }
                .warning-title { 
                  color: #f4c430; 
                  font-weight: 600;
                  margin-bottom: 10px;
                  font-size: 16px;
                }
                .warning ul { 
                  color: #b3b3b3; 
                  margin: 10px 0 0 20px;
                  font-size: 14px;
                }
                .warning li { 
                  margin: 8px 0;
                }
                .note { 
                  color: #808080; 
                  font-size: 14px;
                  margin: 20px 0;
                }
                .signature { 
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #2a2a2a;
                }
                .signature-text { 
                  color: #b3b3b3; 
                  font-size: 15px;
                }
                .signature-name { 
                  color: #f4c430; 
                  font-weight: 600;
                  font-size: 16px;
                }
                .footer { 
                  background: #141414;
                  padding: 30px;
                  text-align: center;
                  border-top: 1px solid #2a2a2a;
                }
                .footer-text { 
                  color: #666; 
                  font-size: 12px;
                  margin: 5px 0;
                }
                .footer-link { 
                  color: #f4c430; 
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">🎬 CINEHUB</div>
                  <div class="tagline">YOUR MOVIE COMMUNITY</div>
                </div>
                
                <div class="content">
                  <div class="greeting">Hello ${userName}! 👋</div>
                  
                  <div class="message">
                    Welcome to CineHub! To complete your registration, please use the verification code below:
                  </div>
                  
                  <div class="otp-box">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-expiry">⏱️ Valid for 10 minutes</div>
                  </div>

                  <div class="warning">
                    <div class="warning-title">⚠️ Security Notice</div>
                    <ul>
                      <li>Never share this code with anyone</li>
                      <li>CineHub will never ask for your code via phone or email</li>
                      <li>This code expires in 10 minutes</li>
                    </ul>
                  </div>

                  <div class="note">
                    If you didn't request this code, please ignore this email or contact our support team.
                  </div>
                  
                  <div class="signature">
                    <div class="signature-text">Happy watching! 🍿</div>
                    <div class="signature-name">The CineHub Team</div>
                  </div>
                </div>
                
                <div class="footer">
                  <div class="footer-text">© 2025 CineHub. All rights reserved.</div>
                  <div class="footer-text">This is an automated message, please do not reply.</div>
                </div>
              </div>
            </body>
            </html>
          `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email sent successfully to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return true;

      } catch (emailError) {
        console.error('❌ Email Error:', emailError.message);
        return false;
      }
    }

    // If no email service configured, return true (OTP logged to console)
    return true;

  } catch (error) {
    console.error('Email Service Error:', error);
    return false;
  }
};

/**
 * Send welcome email after successful registration
 * @param {string} email - Email address
 * @param {string} userName - User's name
 * @returns {Promise<boolean>} - Success status
 */
export const sendWelcomeEmail = async (email, userName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return true; // Skip if not configured
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: `"CineHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to CineHub - 50 Points Bonus!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #141414;
              color: #f2f2f2;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #1f1f1f;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .header { 
              background: linear-gradient(135deg, #141414 0%, #1f1f1f 100%);
              padding: 40px 30px;
              text-align: center;
              border-bottom: 3px solid #f4c430;
            }
            .logo { 
              font-size: 36px; 
              font-weight: 800; 
              color: #f4c430;
              margin-bottom: 8px;
            }
            .tagline { color: #b3b3b3; font-size: 14px; }
            .content { padding: 40px 30px; background: #1f1f1f; }
            .greeting { font-size: 24px; font-weight: 600; color: #f2f2f2; margin-bottom: 20px; }
            .message { color: #b3b3b3; margin-bottom: 30px; font-size: 16px; }
            .points-box {
              background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
              border: 2px solid #f4c430;
              border-radius: 12px;
              padding: 25px;
              text-align: center;
              margin: 30px 0;
            }
            .points-number {
              font-size: 48px;
              font-weight: 800;
              color: #f4c430;
              margin: 10px 0;
            }
            .points-label { color: #b3b3b3; font-size: 14px; }
            .feature {
              background: rgba(244, 196, 48, 0.05);
              border-left: 3px solid #f4c430;
              padding: 15px;
              margin: 15px 0;
              border-radius: 6px;
            }
            .feature-title { color: #f4c430; font-weight: 600; margin-bottom: 5px; }
            .feature-desc { color: #b3b3b3; font-size: 14px; }
            .cta-button {
              display: inline-block;
              background: #f4c430;
              color: #141414;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #141414;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #2a2a2a;
            }
            .footer-text { color: #666; font-size: 12px; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎬 CINEHUB</div>
              <div class="tagline">YOUR MOVIE COMMUNITY</div>
            </div>
            
            <div class="content">
              <div class="greeting">Welcome, ${userName}! 🎉</div>
              
              <div class="message">
                Your account has been successfully created. We're thrilled to have you join the CineHub community!
              </div>

              <div class="points-box">
                <div class="points-label">🎁 Welcome Bonus</div>
                <div class="points-number">50</div>
                <div class="points-label">POINTS CREDITED</div>
              </div>
              
              <div class="message">
                <strong>What you can do now:</strong>
              </div>

              <div class="feature">
                <div class="feature-title">🎬 Discover Movies</div>
                <div class="feature-desc">Browse thousands of movies and find your next favorite</div>
              </div>

              <div class="feature">
                <div class="feature-title">⭐ Write Reviews</div>
                <div class="feature-desc">Share your thoughts and earn more points</div>
              </div>

              <div class="feature">
                <div class="feature-title">📝 Create Watchlists</div>
                <div class="feature-desc">Keep track of movies you want to watch</div>
              </div>

              <div class="feature">
                <div class="feature-title">🏆 Earn Points & Level Up</div>
                <div class="feature-desc">Get rewarded for your contributions</div>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta-button">
                  Start Exploring 🍿
                </a>
              </div>

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2a2a; text-align: center;">
                <div style="color: #b3b3b3; font-size: 15px;">Happy watching!</div>
                <div style="color: #f4c430; font-weight: 600; font-size: 16px; margin-top: 5px;">The CineHub Team</div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">© 2025 CineHub. All rights reserved.</div>
              <div class="footer-text">This is an automated message, please do not reply.</div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;

  } catch (error) {
    console.error('Welcome email error:', error);
    return false;
  }
};
