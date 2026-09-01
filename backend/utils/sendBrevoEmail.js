const axios = require('axios');

/**
 * Send Transactional Email using Brevo (Sendinblue) API v3
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit verification code
 * @returns {Promise<{success: boolean, message: string}>}
 */
const sendBrevoOTP = async (toEmail, otpCode) => {
  const apiKey = process.env.BREVO_API_KEY;
  // Default to the verified Brevo sender email for guaranteed delivery
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'manpreetsgrewal5911@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'HostelAdda Verification';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 30px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; color: #ea580c; margin-bottom: 20px; }
        .otp-box { background: rgba(234, 88, 12, 0.15); border: 2px dashed #ea580c; border-radius: 12px; font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 6px; padding: 15px; margin: 25px 0; }
        .muted { color: #94a3b8; font-size: 14px; line-height: 1.5; }
        .footer { margin-top: 25px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">HostelAdda</div>
        <h2>Verify Your Email Address</h2>
        <p class="muted">Use the 6-digit Verification OTP code below to complete your HostelAdda account registration.</p>
        <div class="otp-box">${otpCode}</div>
        <p class="muted">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        <div class="footer">
          &copy; HostelAdda Student Platform &bull; Chitkara University Ecosystem
        </div>
      </div>
    </body>
    </html>
  `;

  if (!apiKey) {
    console.log(`[DEVELOPMENT MODE - BREVO_API_KEY NOT SET] OTP for ${toEmail}: ${otpCode}`);
    return { success: true, message: 'OTP generated (logged to server console).' };
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: `${otpCode} is your HostelAdda Email Verification Code`,
        htmlContent: htmlContent
      },
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log(`Brevo Email sent successfully to ${toEmail}. Message ID: ${response.data.messageId}`);
    return { success: true, message: 'OTP sent to your email.' };
  } catch (error) {
    console.error('Brevo API Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send OTP email via Brevo.'
    };
  }
};

module.exports = { sendBrevoOTP };
