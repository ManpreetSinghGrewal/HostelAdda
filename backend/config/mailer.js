const nodemailer = require('nodemailer');

const DEFAULT_EMAIL_USER = 'manpreetsgrewal5911@gmail.com';
const DEFAULT_EMAIL_PASS = 'zliq tiod efka wgpm';

// Create transporter dynamically based on env variables or fallback
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || DEFAULT_EMAIL_USER;
  const rawPass = process.env.EMAIL_PASS;
  // If env password is short or invalid (like old password manii3720C), use App Password
  const emailPass = (rawPass && rawPass.replace(/\s+/g, '').length === 16) ? rawPass : DEFAULT_EMAIL_PASS;

  if (emailUser && emailPass) {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || emailUser,
          pass: process.env.SMTP_PASS || emailPass,
        },
      });
    }

    const cleanPass = emailPass.replace(/\s+/g, '');

    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL on port 465 for reliable cloud server delivery
      auth: {
        user: emailUser,
        pass: cleanPass,
      },
    });
  }

  return null;
};

const sendOtpEmail = async (toEmail, otp) => {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border-radius: 12px; background-color: #0f172a; color: #f8fafc; border: 1px solid #334155;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155;">
        <h1 style="color: #6366f1; margin: 0; font-size: 28px;">HostelAdda</h1>
        <p style="color: #94a3b8; margin-top: 5px; font-size: 14px;">Chitkara University Hostel Community</p>
      </div>
      
      <div style="padding: 25px 10px; text-align: center;">
        <h2 style="color: #f8fafc; font-size: 20px; margin-bottom: 15px;">Email Verification Code</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">
          Use the following 6-digit One-Time Password (OTP) to complete your HostelAdda registration:
        </p>
        
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 10px; padding: 18px; display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #ffffff; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3); margin-bottom: 20px;">
          ${otp}
        </div>
        
        <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
          This OTP is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
        </p>
      </div>
      
      <div style="text-align: center; border-top: 1px solid #334155; padding-top: 15px; font-size: 12px; color: #64748b;">
        <p>If you didn't request this email, please ignore it.</p>
        <p>&copy; ${new Date().getFullYear()} HostelAdda (Chitmeet)</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[DEV OTP NOTIFICATION] Mail server credentials not set`);
    console.log(`[DEV OTP NOTIFICATION] OTP for ${toEmail}: ${otp}`);
    console.log(`======================================================\n`);
    return { sent: false, isDevFallback: true };
  }

  try {
    const senderEmail = process.env.EMAIL_USER || DEFAULT_EMAIL_USER;
    await transporter.sendMail({
      from: `"HostelAdda" <${senderEmail}>`,
      to: toEmail,
      subject: `${otp} is your HostelAdda Registration OTP`,
      text: `Your OTP for HostelAdda registration is: ${otp}. Valid for 5 minutes.`,
      html: htmlContent,
    });
    console.log(`[EMAIL SENT SUCCESS] OTP sent to ${toEmail}`);
    return { sent: true, isDevFallback: false };
  } catch (error) {
    console.error(`[EMAIL SEND FAILED] Error sending email to ${toEmail}:`, error.message);
    
    // Retry with DEFAULT_EMAIL_PASS if env password failed
    try {
      console.log(`[RETRY] Retrying email dispatch with default App Password...`);
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: DEFAULT_EMAIL_USER,
          pass: DEFAULT_EMAIL_PASS.replace(/\s+/g, ''),
        },
      });

      await fallbackTransporter.sendMail({
        from: `"HostelAdda" <${DEFAULT_EMAIL_USER}>`,
        to: toEmail,
        subject: `${otp} is your HostelAdda Registration OTP`,
        text: `Your OTP for HostelAdda registration is: ${otp}. Valid for 5 minutes.`,
        html: htmlContent,
      });
      console.log(`[RETRY SUCCESS] OTP sent to ${toEmail}`);
      return { sent: true, isDevFallback: false };
    } catch (retryErr) {
      console.error(`[RETRY FAILED] Error on fallback retry:`, retryErr.message);
      return { sent: false, isDevFallback: true, error: retryErr.message };
    }
  }
};

module.exports = { sendOtpEmail };
