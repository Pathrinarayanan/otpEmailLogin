const fs = require('fs');
const path = require('path');

// Create base directory for OTP storage
const OTP_BASE_DIR = path.join(__dirname, 'otp_storage');

// Configuration
const CLEANUP_THRESHOLD = 120; // Clean folders older than 10 seconds
const VERIFICATION_THRESHOLD = 120; // OTP valid for 5 minutes (300 seconds)

// Ensure base directory exists
if (!fs.existsSync(OTP_BASE_DIR)) {
  fs.mkdirSync(OTP_BASE_DIR, { recursive: true });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create timestamp folder and return path
function createTimestampFolder() {
  const timestamp = Date.now();
  const folderPath = path.join(OTP_BASE_DIR, timestamp.toString());
  fs.mkdirSync(folderPath, { recursive: true });
  return { folderPath, timestamp };
}

// Clean old timestamp folders (only called on send-otp)
function cleanOldFolders() {
  try {
    const currentTime = Date.now();
    const folders = fs.readdirSync(OTP_BASE_DIR);
    
    folders.forEach(folder => {
      const folderPath = path.join(OTP_BASE_DIR, folder);
      const folderTime = parseInt(folder);
      
      // If folder is older than cleanup threshold, delete it
      if (currentTime - folderTime > (CLEANUP_THRESHOLD * 1000)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
      }
    });
  } catch (error) {
    console.error('Error cleaning old folders:', error);
  }
}

// Store OTP for specific email
function storeOTP(email, otp) {
  // Clean old folders first
  cleanOldFolders();
  
  // Create new timestamp folder
  const { folderPath, timestamp } = createTimestampFolder();
  
  // Create file with email name
  const emailFile = path.join(folderPath, `${email}.json`);
  
  const otpData = {
    email: email,
    otp: otp,
    timestamp: timestamp,
    createdAt: new Date().toISOString()
  };
  
  fs.writeFileSync(emailFile, JSON.stringify(otpData, null, 2));
  
  return { folderPath, timestamp };
}

// Get OTP for specific email
function getOTP(email) {
  try {
    // Search in all timestamp folders (no cleanup here)
    const folders = fs.readdirSync(OTP_BASE_DIR);
    
    for (const folder of folders) {
      const folderPath = path.join(OTP_BASE_DIR, folder);
      const emailFile = path.join(folderPath, `${email}.json`);
      
      if (fs.existsSync(emailFile)) {
        const data = fs.readFileSync(emailFile, 'utf8');
        const otpData = JSON.parse(data);
        
        // Check if OTP is still valid (within verification threshold)
        const currentTime = Date.now();
        if (currentTime - otpData.timestamp <= (VERIFICATION_THRESHOLD * 1000)) {
          return otpData.otp;
        } else {
          // OTP expired, remove the file
          fs.unlinkSync(emailFile);
          return null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting OTP:', error);
    return null;
  }
}

// Remove OTP file for specific email
function removeOTP(email) {
  try {
    const folders = fs.readdirSync(OTP_BASE_DIR);
    
    for (const folder of folders) {
      const folderPath = path.join(OTP_BASE_DIR, folder);
      const emailFile = path.join(folderPath, `${email}.json`);
      
      if (fs.existsSync(emailFile)) {
        fs.unlinkSync(emailFile);
        return true;
      }
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
    const result = {};
    const folders = fs.readdirSync(OTP_BASE_DIR);
    
    folders.forEach(folder => {
      const folderPath = path.join(OTP_BASE_DIR, folder);
      const files = fs.readdirSync(folderPath);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const email = file.replace('.json', '');
          const filePath = path.join(folderPath, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          result[email] = data.otp;
        }
      });
    });
    
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
