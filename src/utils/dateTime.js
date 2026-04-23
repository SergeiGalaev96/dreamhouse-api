const { literal } = require('sequelize');

const APP_TIME_ZONE = 'Asia/Bishkek';

const getLocalTimestamp = (date = new Date()) => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

module.exports = {
  APP_TIME_ZONE,
  getLocalTimestamp,
  localTimestampLiteral: () => literal('LOCALTIMESTAMP')
};
