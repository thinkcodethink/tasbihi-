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

  const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;
  const payload = {
    title: "Premium Theme",
    description: "Unlock the premium dark and gold theme for your Tasbih app.",
    payload: "premium_theme_unlock",
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
