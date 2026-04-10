const admin = require('firebase-admin');
const sequelize = require('../config/database');
const PushDeviceToken = require('../models/PushDeviceToken');

let initialized = false;
let tableReady = false;

const ensurePushDeviceTokensTable = async () => {
  if (tableReady) return;

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS construction.push_device_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      platform VARCHAR(30),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted BOOLEAN DEFAULT false
    )
  `);

  tableReady = true;
};

const initializeFirebase = () => {
  if (initialized) return true;

  if (admin.apps.length) {
    initialized = true;
    return true;
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      console.warn('[push] Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.');
      return false;
    }

    initialized = true;
    return true;
  } catch (error) {
    console.error('[push] Firebase init error:', error.message);
    return false;
  }
};

const registerPushToken = async ({ userId, token, platform }) => {
  await ensurePushDeviceTokensTable();

  const [deviceToken, created] = await PushDeviceToken.findOrCreate({
    where: { token },
    defaults: {
      user_id: userId,
      token,
      platform,
      is_active: true,
      deleted: false
    }
  });

  if (!created) {
    await deviceToken.update({
      user_id: userId,
      platform,
      is_active: true,
      deleted: false,
      updated_at: new Date()
    });
  }

  return deviceToken;
};

const sendPushToUser = async ({ userId, title, body, data = {} }) => {
  await ensurePushDeviceTokensTable();

  if (!initializeFirebase()) return;

  const deviceTokens = await PushDeviceToken.findAll({
    where: {
      user_id: userId,
      is_active: true,
      deleted: false
    }
  });

  const tokens = deviceTokens.map(item => item.token).filter(Boolean);

  if (!tokens.length) {
    console.log(`[push] no active tokens for user_${userId}`);
    return;
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title,
      body
    },
    data: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    )
  });

  console.log(`[push] sent to user_${userId}; success=${response.successCount}; failed=${response.failureCount}`);

  const invalidTokens = response.responses
    .map((item, index) => ({ item, token: tokens[index] }))
    .filter(({ item }) => !item.success && [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered'
    ].includes(item.error?.code))
    .map(({ token }) => token);

  if (invalidTokens.length) {
    await PushDeviceToken.update(
      { is_active: false, deleted: true },
      { where: { token: invalidTokens } }
    );
  }
};

module.exports = {
  registerPushToken,
  sendPushToUser
};
