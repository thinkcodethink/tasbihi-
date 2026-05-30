const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;
  const requestSecretToken = event.headers['x-telegram-bot-api-secret-token'];
  
  if (TELEGRAM_SECRET_TOKEN && requestSecretToken !== TELEGRAM_SECRET_TOKEN) {
    return { statusCode: 403, body: 'Unauthorized' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Pre-checkout query - Telegram checking if we are ready
  if (body.pre_checkout_query) {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const queryId = body.pre_checkout_query.id;
    
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pre_checkout_query_id: queryId,
        ok: true
      })
    });
    
    return { statusCode: 200, body: 'OK' };
  }

  // Successful payment - The user actually paid
  if (body.message && body.message.successful_payment) {
    const payload = body.message.successful_payment.invoice_payload;
    if (!payload || !payload.startsWith('premium_theme_unlock_')) {
      return { statusCode: 200, body: 'Ignored: Not a premium theme payment' };
    }

    const userId = body.message.from.id.toString();
    
    // Store in Netlify Blobs
    const premiumStore = getStore("premium_users");
    await premiumStore.set(userId, JSON.stringify({ premium: true, timestamp: Date.now() }));
    
    return { statusCode: 200, body: 'Payment processed' };
  }

  return { statusCode: 200, body: 'Ignored' };
};
