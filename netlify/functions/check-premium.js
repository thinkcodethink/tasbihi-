const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { initData } = body;
  if (!initData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No initData provided' }) };
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'BOT_TOKEN not configured' }) };
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

  // Extract user ID
  let user;
  try {
    user = JSON.parse(urlParams.get('user'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid user object' }) };
  }

  const userId = user.id.toString();

  // Check Netlify Blobs for premium status
  const premiumStore = getStore("premium_users");
  const userData = await premiumStore.get(userId);

  if (userData) {
    return { statusCode: 200, body: JSON.stringify({ premium: true }) };
  }

  return { statusCode: 200, body: JSON.stringify({ premium: false }) };
};
