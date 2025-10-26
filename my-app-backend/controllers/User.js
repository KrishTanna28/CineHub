import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { uploadAvatarToCloudinary } from '../utils/cloudinaryHelper.js';
import { sendOTPEmail, sendWelcomeEmail } from '../utils/emailService.js';

// Temporary storage for pending registrations (in production, use Redis)
const pendingRegistrations = new Map();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register new user (Step 1: Send OTP, don't create user yet)
// @route   POST /api/users/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      let message = 'User already exists';
      if (existingUser.email === email) message = 'Email already registered';
      else if (existingUser.username === username) message = 'Username already taken';
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Generate OTP (6-digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store registration data temporarily (will be deleted after verification or expiry)
    const registrationId = `${email}_${Date.now()}`;
    pendingRegistrations.set(registrationId, {
      username,
      email,
      password,
      fullName,
      referralCode,
      avatar: req.file ? req.file.buffer : null,
      avatarName: req.file ? req.file.originalname : null,
      otp,
      otpExpiresAt,
      otpAttempts: 0,
      createdAt: new Date()
    });

    // Auto-delete after 15 minutes
    setTimeout(() => {
      pendingRegistrations.delete(registrationId);
    }, 15 * 60 * 1000);

    // Send OTP via Email (FREE & Unlimited)
    try {
      const emailSent = await sendOTPEmail(email, otp, fullName);
      if (!emailSent) {
        pendingRegistrations.delete(registrationId);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please check your email address.'
        });
      }
    } catch (emailError) {
      pendingRegistrations.delete(registrationId);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox and verify to complete registration.',
      data: {
        registrationId,
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
        otpExpiresIn: '10 minutes'
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Complete registration (Step 2: Verify OTP and create user)
// @route   POST /api/users/complete-registration
// @access  Public
export const completeRegistration = async (req, res, next) => {
  try {
    const { registrationId, otp } = req.body;

    if (!registrationId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID and OTP are required'
      });
    }

    // Get pending registration data
    const pendingData = pendingRegistrations.get(registrationId);

    if (!pendingData) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired or invalid. Please register again.'
      });
    }

    // Check OTP attempts
    if (pendingData.otpAttempts >= 3) {
      pendingRegistrations.delete(registrationId);
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP attempts exceeded. Please register again.'
      });
    }

    // Check if OTP expired
    if (new Date() > pendingData.otpExpiresAt) {
      pendingRegistrations.delete(registrationId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please register again.'
      });
    }

    // Verify OTP
    if (pendingData.otp !== otp) {
      pendingData.otpAttempts += 1;
      pendingRegistrations.set(registrationId, pendingData);
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - pendingData.otpAttempts} attempts remaining.`
      });
    }

    // OTP verified! Now create the user
    const userData = {
      username: pendingData.username,
      email: pendingData.email,
      password: pendingData.password,
      fullName: pendingData.fullName,
      emailVerified: true  // Mark as verified since OTP is confirmed
    };

    // Create user
    const user = await User.create(userData);

    // Handle avatar upload if provided
    if (pendingData.avatar) {
      try {
        const avatarUrl = await uploadAvatarToCloudinary(
          pendingData.avatar,
          pendingData.avatarName,
          user._id
        );
        user.avatar = avatarUrl;
        await user.save();
      } catch (uploadError) {
        console.error('Avatar upload failed:', uploadError);
        // Continue even if avatar fails
      }
    }

    // Handle referral if provided
    let referralResult = null;
    if (pendingData.referralCode) {
      referralResult = await user.processReferral(pendingData.referralCode);
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Continue even if welcome email fails
    }

    // Delete pending registration
    pendingRegistrations.delete(registrationId);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully! You received 50 welcome points! 🎉',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          points: user.points,
          level: user.level,
          referralCode: user.referralCode,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        },
        token,
        referralReward: referralResult,
        welcomeBonus: {
          points: 50,
          message: '🎁 Welcome bonus credited!'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Update streak
    await user.updateStreak();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          points: user.points,
          level: user.level,
          badges: user.badges,
          streaks: user.streaks,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('reviews')
      .select('-password');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { username, fullName, bio, preferences } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (bio) updateData.bio = bio;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    // Handle avatar upload if file is provided
    if (req.file) {
      try {
        const avatarUrl = await uploadAvatarToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.user._id
        );
        updateData.avatar = avatarUrl;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Avatar upload failed. Please try again.'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/me/password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('reviews');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add movie to watchlist
// @route   POST /api/users/me/watchlist
// @access  Private
export const addToWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.body;

    await req.user.addToWatchlist(movieId);
    await req.user.addPoints(5, 'add_to_watchlist');

    res.json({
      success: true,
      message: 'Movie added to watchlist',
      data: { watchlist: req.user.watchlist }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove movie from watchlist
// @route   DELETE /api/users/me/watchlist/:movieId
// @access  Private
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    await req.user.removeFromWatchlist(movieId);

    res.json({
      success: true,
      message: 'Movie removed from watchlist',
      data: { watchlist: req.user.watchlist }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add movie to favorites
// @route   POST /api/users/me/favorites
// @access  Private
export const addToFavorites = async (req, res, next) => {
  try {
    const { movieId } = req.body;

    await req.user.addToFavorites(movieId);
    await req.user.addPoints(5, 'add_to_favorites');

    res.json({
      success: true,
      message: 'Movie added to favorites',
      data: { favorites: req.user.favorites }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove movie from favorites
// @route   DELETE /api/users/me/favorites/:movieId
// @access  Private
export const removeFromFavorites = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    await req.user.removeFromFavorites(movieId);

    res.json({
      success: true,
      message: 'Movie removed from favorites',
      data: { favorites: req.user.favorites }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate a movie
// @route   POST /api/users/me/ratings
// @access  Private
export const rateMovie = async (req, res, next) => {
  try {
    const { movieId, rating } = req.body;

    // Check if already rated
    const existingRating = req.user.ratings.find(r => r.movieId === movieId);

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.ratedAt = new Date();
    } else {
      req.user.ratings.push({ movieId, rating });
      req.user.achievements.ratingsGiven += 1;
      await req.user.addPoints(10, 'rate_movie');
    }

    await req.user.save();

    res.json({
      success: true,
      message: 'Movie rated successfully',
      data: { ratings: req.user.ratings }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user stats
// @route   GET /api/users/me/stats
// @access  Private
export const getUserStats = async (req, res, next) => {
  try {
    const stats = {
      points: req.user.points,
      level: req.user.level,
      badges: req.user.badges.length,
      streaks: req.user.streaks,
      achievements: req.user.achievements,
      watchlistCount: req.user.watchlist.length,
      favoritesCount: req.user.favorites.length,
      ratingsCount: req.user.ratings.length,
      followersCount: req.user.followers.length,
      followingCount: req.user.following.length,
      reviewsCount: req.user.reviews.length,
      referralCode: req.user.referralCode
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user watchlist
// @route   GET /api/users/me/watchlist
// @access  Private
export const getUserWatchlist = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { watchlist: req.user.watchlist }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user favorites
// @route   GET /api/users/me/favorites
// @access  Private
export const getUserFavorites = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { favorites: req.user.favorites }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user ratings
// @route   GET /api/users/me/ratings
// @access  Private
export const getUserRatings = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { ratings: req.user.ratings }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    if (req.user.following.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Add to following list
    req.user.following.push(targetUserId);
    await req.user.save();

    // Add to target user's followers list
    targetUser.followers.push(req.user._id);
    await targetUser.save();

    res.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
export const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from following list
    req.user.following = req.user.following.filter(
      id => id.toString() !== targetUserId
    );
    await req.user.save();

    // Remove from target user's followers list
    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await targetUser.save();

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, type = 'points' } = req.query;

    let sortField = 'points.total';
    if (type === 'level') sortField = 'level';
    if (type === 'reviews') sortField = 'achievements.reviewsWritten';
    if (type === 'streak') sortField = 'streaks.longest';

    const users = await User.find({ isActive: true })
      .select('username avatar points level badges streaks achievements')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { leaderboard: users }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP for mobile verification
// @route   POST /api/users/send-verification-otp
// @access  Private
export const sendVerificationOTPController = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.mobileVerified) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is already verified'
      });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via SMS
    const smsSent = await sendVerificationOTP(user.mobile, otp);

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Verification OTP sent successfully',
      data: {
        mobile: user.mobile.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3'),
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify mobile number
// @route   POST /api/users/verify-mobile
// @access  Private
export const verifyMobileController = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id).select('+otp.code +otp.expiresAt +otp.attempts');

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    // Verify OTP
    const verificationResult = user.verifyOTP(otp);

    if (!verificationResult.success) {
      await user.save(); // Save updated attempts
      return res.status(400).json(verificationResult);
    }

    // Save verification status
    await user.save();

    res.json({
      success: true,
      message: 'Mobile number verified successfully',
      data: {
        mobileVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
};
