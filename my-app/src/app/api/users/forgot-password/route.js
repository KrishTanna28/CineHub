import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/config/database';
import User from '@/lib/models/User';
import { sendPasswordResetEmail } from '@/lib/utils/emailService';

/**
 * POST /api/users/forgot-password
 * Send password reset email with token
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash token before saving to database
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Save hashed token and expiry to user
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send password reset email with unhashed token
      const emailSent = await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username || user.fullName || 'User'
      );

      if (!emailSent) {
        console.error('Failed to send password reset email');
        // Continue anyway - we don't want to reveal if email failed
      }
    }

    // Always return success message (security best practice)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
