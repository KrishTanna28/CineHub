import User from '../models/User.js';
import { uploadAvatarToCloudinary, deleteImageFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Upload avatar image
// @route   POST /api/upload/avatar
// @access  Private
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image file.'
      });
    }

    // Upload to Cloudinary using helper
    const avatarUrl = await uploadAvatarToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.user._id
    );

    // Update user's avatar in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarUrl,
        user
      }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(error);
  }
};

// @desc    Delete avatar image
// @route   DELETE /api/upload/avatar
// @access  Private
export const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user has a custom avatar (not default)
    if (!user.avatar || user.avatar.includes('placeholder')) {
      return res.status(400).json({
        success: false,
        message: 'No custom avatar to delete'
      });
    }

    // Delete from Cloudinary using helper
    await deleteImageFromCloudinary(user.avatar);

    // Reset to default avatar
    user.avatar = 'https://via.placeholder.com/150';
    await user.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    next(error);
  }
};

// @desc    Upload multiple images (for future use - movie posters, banners, etc.)
// @route   POST /api/upload/images
// @access  Private (Admin/Moderator)
export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const url = await uploadAvatarToCloudinary(
        file.buffer,
        file.originalname,
        `general_${Date.now()}`
      );
      
      return { url };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        images: uploadedImages
      }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(error);
  }
};
