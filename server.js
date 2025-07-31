require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { generateOTP, storeOTP, getOTP, removeOTP, getAllOTPs } = require('./otpStore');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  
  const otp = generateOTP();
  storeOTP(email, otp);

  try {
    await transporter.sendMail({
      from: `"Mock Whatsapp Login" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otp}`
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending email', error: err });
  }
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }
  
  const storedOTP = getOTP(email);
  
  // Convert both to strings for comparison to handle number/string mismatch
  if (storedOTP && storedOTP.toString() === otp.toString()) {
    removeOTP(email); // Clear OTP after success
    res.json({ success: true, message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
