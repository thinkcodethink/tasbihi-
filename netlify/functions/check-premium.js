const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
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

    if (calculatedHash.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash))) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    // Validate auth_date to prevent replay attacks (24 hours expiration)
    const authDate = parseInt(urlParams.get('auth_date'), 10);
    const now = Math.floor(Date.now() / 1000);
    if (!authDate || now - authDate > 86400) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Session expired' }) };
    }

    // Extract user ID safely
    let user;
    try {
      const userStr = urlParams.get('user');
      if (!userStr) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No user string found in initData' }) };
      }
      user = JSON.parse(userStr);
      if (!user || !user.id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'User object missing ID' }) };
      }
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid user object parse: ' + e.message }) };
    }

    const userId = user.id.toString();

    // Check Netlify Blobs for premium status
    const premiumStore = getStore("premium_users");
    const userData = await premiumStore.get(userId);

    if (userData) {
      return { statusCode: 200, body: JSON.stringify({ premium: true }) };
    }

    return { statusCode: 200, body: JSON.stringify({ premium: false }) };
  } catch (error) {
    // Catch any uncaught exceptions that would normally cause a 502 Bad Gateway
    console.error("FATAL ERROR in check-premium:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Internal Server Error"
      })
    };
  }
};
