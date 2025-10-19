import cloudinary from '../config/cloudinary.js';
import DatauriParser from 'datauri/parser.js';
import path from 'path';

const parser = new DatauriParser();

/**
 * Convert buffer to data URI
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} fileName - Original file name
 * @returns {Object} Data URI object
 */
export const bufferToDataURI = (fileBuffer, fileName) => {
  const extname = path.extname(fileName).toString();
  return parser.format(extname, fileBuffer);
};

/**
 * Upload avatar to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} fileName - Original file name
 * @param {String} userId - User ID for unique naming
 * @returns {Promise<String>} Cloudinary secure URL
 */
export const uploadAvatarToCloudinary = async (fileBuffer, fileName, userId) => {
  try {
    const file = bufferToDataURI(fileBuffer, fileName);

    const result = await cloudinary.uploader.upload(file.content, {
      folder: 'moviehub/avatars',
      public_id: `user_${userId}_${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      overwrite: true,
      resource_type: 'image'
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param {String} imageUrl - Cloudinary image URL
 * @returns {Promise<void>}
 */
export const deleteImageFromCloudinary = async (imageUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const publicIdWithExt = urlParts.slice(-2).join('/');
    const publicId = publicIdWithExt.split('.')[0];

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};
