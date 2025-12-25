import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/withAuth.js'

// GET /api/users/me - Get current user profile
export const GET = withAuth(async (request, { user }) => {
  try {
    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get profile'
      },
      { status: 500 }
    )
  }
})

// PUT /api/users/me - Update current user profile
export const PUT = withAuth(async (request, { user }) => {
  try {
    const formData = await request.formData()
    const fullName = formData.get('fullName')
    const bio = formData.get('bio')
    const avatarFile = formData.get('avatar')

    // Update allowed fields
    if (fullName) user.fullName = fullName
    if (bio !== null) user.bio = bio

    // Handle avatar upload if provided
    if (avatarFile) {
      const { uploadAvatarToCloudinary } = await import('@/lib/utils/cloudinaryHelper.js')
      const avatarBuffer = Buffer.from(await avatarFile.arrayBuffer())
      const avatarUrl = await uploadAvatarToCloudinary(avatarBuffer, avatarFile.name)
      user.avatar = avatarUrl
    }

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update profile'
      },
      { status: 500 }
    )
  }
})
