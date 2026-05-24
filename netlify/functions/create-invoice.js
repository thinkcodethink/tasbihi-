const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "BOT_TOKEN environment variable is not set." })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { initData } = body;
  if (!initData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No initData provided' }) };
  }

  // Verify Telegram initData signature
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const keys = Array.from(urlParams.keys()).sort();
  const dataCheckString = keys.map(key => `${key}=${urlParams.get(key)}`).join('\n');
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (calculatedHash !== hash) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  // Extract user ID safely to include in payload
  let user;
  try {
    user = JSON.parse(urlParams.get('user'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid user object' }) };
  }
  const userId = user && user.id ? user.id.toString() : 'unknown';

  const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;
  const payload = {
    title: "Premium Theme",
    description: "Unlock the premium dark and gold theme for your Tasbih app.",
    payload: `premium_theme_unlock_${userId}`,
    currency: "XTR",
    prices: [{ label: "Premium Theme", amount: 50 }]
  };

  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ invoiceLink: data.result })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: data.description || "Failed to create invoice" })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
