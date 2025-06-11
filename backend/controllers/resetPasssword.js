const User = require('../models/User');

const resetPassword = async (req, res) => {
  try {
    const { email, passwordResetCode, newPassword } = req.body;

    console.log('Reset password attempt:', { email, passwordResetCode });

    // Validate required fields
    if (!email || !passwordResetCode || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    // Find user with reset code
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      passwordResetCode: passwordResetCode  // Use consistent field name
    });

    if (!user) {
      console.log('User not found or invalid reset code');
      return res.status(400).json({ 
        success: false,
        error: "Invalid reset code or email address" 
      });
    }

    // Check if the reset code has expired
    if (user.passwordResetExpires && user.passwordResetExpires < Date.now()) {
      console.log('Reset code expired');
      return res.status(400).json({ 
        success: false,
        error: "Password reset code has expired. Please request a new one." 
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long"
      });
    }

    console.log('All validations passed, updating password...');

    // Set the new password and clear reset fields
    user.password = newPassword; // This will be hashed by the pre-save hook
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    
    // Clear old field names for backward compatibility
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;

    await user.save(); // This triggers the pre-save hook to hash the password

    console.log('Password reset successful for user:', user.email);

    res.status(200).json({ 
      success: true,
      message: "Password reset successful" 
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ 
      success: false,
      error: "Something went wrong: " + error.message
    });
  }
};

module.exports = resetPassword;



// 🔁 Password Reset Flow

//     Input Validation

//         Ensures email, passwordResetCode, and newPassword are provided.

//         Rejects missing fields with 400 Bad Request.

//     User Lookup

//         Finds user by email and passwordResetCode.

//         Returns error if the code or user does not match.

//     Reset Code Expiry Check

//         Validates that the code has not expired (passwordResetExpires vs Date.now()).

//         If expired, informs the user and advises requesting a new code.

// 🔐 New Password Validation

//     Ensures newPassword is at least 6 characters long.

//     Rejects weak or missing passwords with a clear error.

// 🔄 Password Update & Cleanup

//     Sets user.password to the new password (auto-hashed via pre-save middleware).

//     Clears reset-related fields:

//         passwordResetCode, passwordResetExpires

//         (Also clears legacy fields: resetCode, resetCodeExpires)

// ✅ Final Response

//     On success:

//         Saves the user with the new password.

//         Returns 200 OK with a success message.

//     On failure:

//         Logs detailed error.

//         Returns 500 Internal Server Error with the error message.

// Would you like these grouped into a Markdown