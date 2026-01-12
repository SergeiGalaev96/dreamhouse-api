const cron = require('node-cron');
const axios = require('axios');
const xml2js = require('xml2js');

const { Currency, CurrencyRate } = require('../models');
const sequelize = require('../config/database');

const NBKR_URL = 'https://www.nbkr.kg/XML/daily.xml';

/* ===================== HELPERS ===================== */

function parseNbkrDate(nbkrDate) {
  if (!nbkrDate) return null;

  const [day, month, year] = nbkrDate.split('.');
  const date = new Date(`${year}-${month}-${day}`);

  return isNaN(date) ? null : date;
}

async function fetchNbkrRates() {
  const response = await axios.get(NBKR_URL, { timeout: 10000 });

  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true
  });

  const parsed = await parser.parseStringPromise(response.data);

  if (!parsed?.CurrencyRates?.Currency) {
    throw new Error('Invalid NBKR XML structure');
  }

  return {
    date: parsed.CurrencyRates.Date,
    currencies: Array.isArray(parsed.CurrencyRates.Currency)
      ? parsed.CurrencyRates.Currency
      : [parsed.CurrencyRates.Currency]
  };
}

/* ===================== CORE ===================== */

async function updateCurrencyRates({ date, currencies }) {
  if (!Array.isArray(currencies)) {
    throw new Error('Currencies is not array');
  }

  const parsedDate = parseNbkrDate(date);
  if (!parsedDate) {
    throw new Error(`Invalid NBKR date: ${date}`);
  }

  const transaction = await sequelize.transaction();

  try {
    for (const c of currencies) {
      if (!c.ISOCode || !c.Value) continue;

      const rate = Number(String(c.Value).replace(',', '.'));
      if (Number.isNaN(rate)) continue;

      const currency = await Currency.findOne({
        where: { code: c.ISOCode, deleted: false },
        transaction
      });

      if (!currency) continue;

      await CurrencyRate.upsert(
        {
          currency_id: currency.id,
          rate,
          date: parsedDate,
          deleted: false
        },
        { transaction }
      );
    }

    await transaction.commit();
    console.log(`✅ Курсы валют обновлены за ${date}`);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/* ===================== CRON ===================== */

function startCurrencyCron() {
  cron.schedule(
    '1 9 * * *',
    async () => {
      console.log('🕒 CRON START', new Date());

      try {
        const rates = await fetchNbkrRates();
        console.log(`📊 Получено валют: ${rates.currencies.length}`);

        await updateCurrencyRates(rates);
      } catch (err) {
        console.error('❌ CRON ERROR:', err.message);
      }
    },
    { timezone: 'Asia/Bishkek' }
  );
}

module.exports = { startCurrencyCron };