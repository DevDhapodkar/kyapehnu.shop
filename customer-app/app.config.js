// Extends app.json. Its only job is to wire Android FCM (google-services.json)
// *conditionally* — the build succeeds whether or not the file is present yet,
// and push notifications activate automatically once you drop your
// google-services.json (from Firebase → Android app) into this folder.
const fs = require('fs');
const path = require('path');

const { expo } = require('./app.json');

module.exports = () => {
  const config = { ...expo };
  const googleServices = path.join(__dirname, 'google-services.json');

  if (fs.existsSync(googleServices)) {
    config.android = { ...config.android, googleServicesFile: './google-services.json' };
  }

  return config;
};
