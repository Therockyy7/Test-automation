const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

const EMAIL = process.env.FASTDO_EMAIL;
const PASSWORD = process.env.FASTDO_PASSWORD;
const CATBOX_USERHASH = process.env.CATBOX_USERHASH;

if (!EMAIL || !PASSWORD || !CATBOX_USERHASH) {
  throw new Error(
    'Thiếu FASTDO_EMAIL / FASTDO_PASSWORD / CATBOX_USERHASH trong file .env ở root repo. ' +
      'Copy .env.example thành .env rồi điền giá trị thật.'
  );
}

module.exports = {
  CDP_URL: 'http://localhost:9222',
  TARGET_URL: 'https://lp3svsq4-5112.asse.devtunnels.ms/',
  EMAIL,
  PASSWORD,
  ORG_NAME: 'Water Quality - NH3T TEAM',
  SHEET_ID: '1ArYMmaaqbb_g1aa9irROzGXAm1tULQvUw8rq-sXK8Hk',
  SHEET_TAB: 'fEvaluation - VIBE',
  SHEET_ID_COLUMN: 'A',
  SHEET_RESULT_COLUMN: 'I',
  CATBOX_USERHASH,
};
