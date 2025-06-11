const User = require('../models/User'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email configuration - Fixed to use correct environment variables
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'ngareseanmark7@gmail.com',
      pass: process.env.EMAIL_PASS || '654321' // Fixed: was EMAIL_PASSWORD, now EMAIL_PASS
    },
    // Add these options for Gmail
    tls: {
      rejectUnauthorized: false
    }
  });
};

const forgotPassword = async (req, res) => {
  try {
    console.log('Forgot password request received:', req.body);
    
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    console.log('Looking for user with email:', email);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }

    console.log('User found:', user.name);

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('Generated reset code:', resetCode);

    // Save reset code to user - Use consistent field names
    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetCodeExpires;
    await user.save();

    console.log('Reset code saved to user');

    // Check if email sending is enabled
    const emailEnabled = process.env.ENABLE_EMAIL_SENDING === 'true';
    
    if (emailEnabled) {
      try {
        // Create email transporter
        const transporter = createEmailTransporter();

        // Test the connection first
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        // Email content
        const mailOptions = {
          from: `"Assignment System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Password Reset Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>Hello ${user.name || 'User'},</p>
              <p>You have requested to reset your password. Please use the following 6-digit code to reset your password:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${resetCode}</h1>
              </div>
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <hr>
              <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
            </div>
          `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Reset code email sent successfully to:', email);
        console.log('Message ID:', info.messageId);

        res.status(200).json({
          success: true,
          message: 'Password reset code sent to your email address'
        });

      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        console.error('Error details:', emailError.message);
        
        // Still log the code to console as fallback
        console.log('FALLBACK - RESET CODE FOR', email, ':', resetCode);
        
        res.status(200).json({
          success: true,
          message: 'Reset code generated, but email sending failed. Check server console for code.',
          resetCode: resetCode // Remove this in production!
        });
      }
    } else {
      // Email not enabled, just log to console
      console.log('EMAIL SENDING DISABLED - RESET CODE FOR', email, ':', resetCode);
      
      res.status(200).json({
        success: true,
        message: 'Password reset code generated (check server console for code)',
        resetCode: resetCode // Remove this in production!
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate reset code: ' + error.message
    });
  }
};

module.exports = forgotPassword;



//  Password Reset Flow

//     Input Validation

//         Validates that email is provided in the request body.

//     User Lookup

//         Finds a user by their lowercase email.

//         Returns a 404 if no user is found.

// 🔐 Reset Code Generation

//     Generates a 6-digit numeric code.

//     Sets an expiration time of 10 minutes (passwordResetExpires).

//     Stores the reset code and expiration in the user's database record.

// 📧 Email Sending with nodemailer

//     Email sending is conditional on the ENABLE_EMAIL_SENDING environment variable.

//     Uses a transporter created via nodemailer.createTransport with environment-based configuration.

//     Attempts to verify SMTP connection before sending.

//     Sends an HTML-formatted email with:

//         The reset code.

//         Clear instructions and a 10-minute expiry warning.

//     On success, responds with 200 OK and confirmation message.

// 🔄 Fallbacks and Debugging

//     If email sending fails:

//         Logs the error and reset code to console.

//         Responds with a fallback message including the reset code (not recommended for production).

//     If email sending is disabled:

//         Logs the reset code to console only.

//         Responds with confirmation message and reset code (for development).

// 🛡️ Error Handling

//     Comprehensive try-catch block wraps the logic.

//     Returns 500 Internal Server Error on unexpected failures with descriptive message.





