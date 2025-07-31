const fs = require('fs');
const path = require('path');

// Simple single file storage - works better on hosting platforms
const OTP_STORAGE_FILE = path.join(__dirname, 'otp_data.json');

// Configuration
const VERIFICATION_THRESHOLD = 300; // OTP valid for 5 minutes

// Initialize storage file if it doesn't exist
function initializeStorage() {
  try {
    if (!fs.existsSync(OTP_STORAGE_FILE)) {
      fs.writeFileSync(OTP_STORAGE_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Load OTP data from file
function loadOTPData() {
  try {
    if (fs.existsSync(OTP_STORAGE_FILE)) {
      const data = fs.readFileSync(OTP_STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading OTP data:', error);
  }
  return {};
}

// Save OTP data to file
function saveOTPData(data) {
  try {
    fs.writeFileSync(OTP_STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving OTP data:', error);
  }
}

// Clean expired OTPs
function cleanExpiredOTPs() {
  try {
    const data = loadOTPData();
    const currentTime = Date.now();
    let cleaned = false;
    
    for (const email in data) {
      if (currentTime - data[email].timestamp > (VERIFICATION_THRESHOLD * 1000)) {
        delete data[email];
        cleaned = true;
        console.log(`Removed expired OTP for ${email}`);
      }
    }
    
    if (cleaned) {
      saveOTPData(data);
    }
  } catch (error) {
    console.error('Error cleaning expired OTPs:', error);
  }
}

// Initialize on startup
initializeStorage();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP for specific email
function storeOTP(email, otp) {
  try {
    // Clean expired OTPs first
    cleanExpiredOTPs();
    
    // Load current data
    const data = loadOTPData();
    
    // Store new OTP
    data[email] = {
      otp: otp,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    // Save to file
    saveOTPData(data);
    
    console.log(`OTP stored for ${email}: ${otp}`);
    return { success: true };
  } catch (error) {
    console.error('Error storing OTP:', error);
    throw error;
  }
}

// Get OTP for specific email
function getOTP(email) {
  try {
    // Clean expired OTPs first
    cleanExpiredOTPs();
    
    // Load current data
    const data = loadOTPData();
    
    if (data[email]) {
      const currentTime = Date.now();
      if (currentTime - data[email].timestamp <= (VERIFICATION_THRESHOLD * 1000)) {
        console.log(`OTP found for ${email}: ${data[email].otp}`);
        return data[email].otp;
      } else {
        // OTP expired, remove it
        delete data[email];
        saveOTPData(data);
        console.log(`OTP expired for ${email} - removed`);
        return null;
      }
    }
    
    console.log(`No OTP found for ${email}`);
    return null;
  } catch (error) {
    console.error('Error getting OTP:', error);
    return null;
  }
}

// Remove OTP for specific email
function removeOTP(email) {
  try {
    const data = loadOTPData();
    
    if (data[email]) {
      delete data[email];
      saveOTPData(data);
      console.log(`OTP removed for ${email}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing OTP:', error);
    return false;
  }
}

// Get all stored OTPs (for debugging)
function getAllOTPs() {
  try {
    cleanExpiredOTPs();
    const data = loadOTPData();
    const result = {};
    
    for (const email in data) {
      result[email] = data[email].otp;
    }
    
    return result;
  } catch (error) {
    console.error('Error getting all OTPs:', error);
    return {};
  }
}

module.exports = { 
  generateOTP, 
  storeOTP, 
  getOTP, 
  removeOTP,
  getAllOTPs
};
