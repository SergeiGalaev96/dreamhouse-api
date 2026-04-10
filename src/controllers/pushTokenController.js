const { registerPushToken } = require('../utils/pushNotifications');

const register = async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    await registerPushToken({
      userId: req.user.id,
      token,
      platform
    });

    res.json({
      success: true
    });
  } catch (error) {
    console.error('register push token error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  register
};
