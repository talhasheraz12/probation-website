// ============================================
// Vercel Serverless Function: Send Order Email via Resend
// ============================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      payload = {};
    }
  }

  const { order, items } = payload || {};

  if (!order) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const rawAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'talhasheraz12@gmail.com';
  const adminEmails = Array.isArray(rawAdminEmail)
    ? rawAdminEmail
    : rawAdminEmail.split(',').map(e => e.trim()).filter(Boolean);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Probation Orders <onboarding@resend.dev>';

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY environment variable is not configured.');
    return res.status(200).json({
      success: false,
      message: 'RESEND_API_KEY is not set. Add it in Vercel Project Settings -> Environment Variables.'
    });
  }

  const formatRs = (num) => `Rs. ${Number(num || 0).toLocaleString()}`;

  const itemsHtml = (items || []).map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #f4f4f5; font-size: 14px;">
        <strong style="color: #ffffff;">${item.product_name}</strong>
        <div style="color: #a1a1aa; font-size: 12px; margin-top: 4px;">Size: <span style="color:#ffffff; font-weight:600;">${item.size}</span></div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; font-size: 14px; text-align: center;">
        &times; ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #f4f4f5; font-size: 14px; text-align: right; font-weight: 600;">
        ${formatRs((item.unit_price || 0) * (item.quantity || 1))}
      </td>
    </tr>
  `).join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order #${order.order_number || ''}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
      <div style="max-width: 600px; margin: 30px auto; background-color: #121214; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="background-color: #000000; padding: 24px; text-align: center; border-bottom: 1px solid #27272a;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.15em; color: #ffffff; text-transform: uppercase;">PROBATION</h1>
          <p style="margin: 6px 0 0; color: #dc2626; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">🚨 NEW ORDER RECEIVED</p>
        </div>

        <div style="padding: 28px 24px;">
          <!-- Order Summary Badge -->
          <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">Order Number</span>
              <strong style="font-size: 18px; color: #ffffff;">#${order.order_number || ''}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">Payment Method</span>
              <span style="display: inline-block; background: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Cash on Delivery (COD)</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">Total Amount</span>
              <strong style="font-size: 20px; color: #4ade80;">${formatRs(order.total)}</strong>
            </div>
          </div>

          <!-- Customer Details -->
          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #dc2626; margin: 0 0 12px;">Customer Details</h3>
          <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0 0 6px;"><strong>Name:</strong> ${order.customer_name || 'N/A'}</p>
            <p style="margin: 0 0 6px;">
              <strong>Phone:</strong> 
              <a href="tel:${order.customer_phone}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">${order.customer_phone || 'N/A'}</a>
              <span style="color: #71717a; font-size: 12px;">(Click to call)</span>
            </p>
            ${order.customer_email ? `<p style="margin: 0 0 6px;"><strong>Email:</strong> <a href="mailto:${order.customer_email}" style="color: #60a5fa; text-decoration: none;">${order.customer_email}</a></p>` : ''}
            <p style="margin: 0 0 6px;"><strong>City:</strong> ${order.city || 'N/A'}</p>
            <p style="margin: 0 0 6px;"><strong>Shipping Address:</strong> ${order.shipping_address || 'N/A'}</p>
            ${order.notes ? `<p style="margin: 10px 0 0; padding-top: 10px; border-top: 1px dashed #27272a; color: #fbbf24;"><strong>Order Notes:</strong> ${order.notes}</p>` : ''}
          </div>

          <!-- Items Table -->
          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #dc2626; margin: 0 0 12px;">Ordered Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 1px solid #3f3f46;">
                <th style="text-align: left; padding-bottom: 8px; font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Item</th>
                <th style="text-align: center; padding-bottom: 8px; font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Qty</th>
                <th style="text-align: right; padding-bottom: 8px; font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="border-top: 1px solid #27272a; padding-top: 14px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #a1a1aa;">
              <span>Subtotal:</span>
              <span style="color: #f4f4f5;">${formatRs(order.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #a1a1aa;">
              <span>Shipping (COD):</span>
              <span style="color: #f4f4f5;">${formatRs(order.shipping_fee)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #27272a; font-size: 17px; font-weight: 800;">
              <span style="color: #ffffff;">Total Due:</span>
              <span style="color: #4ade80;">${formatRs(order.total)}</span>
            </div>
          </div>

          <!-- Action Button -->
          <div style="margin-top: 28px; text-align: center;">
            <a href="https://probation-website.vercel.app/admin/orders.html" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Open Admin Panel</a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #000000; padding: 16px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a;">
          &copy; ${new Date().getFullYear()} Probation Streetwear. All rights reserved.
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmails,
        subject: `🚨 New Order #${order.order_number || ''} — ${formatRs(order.total)} (${order.customer_name || 'Customer'})`,
        html: emailHtml
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      return res.status(resendResponse.status).json({ error: resendData });
    }

    return res.status(200).json({ success: true, data: resendData });
  } catch (err) {
    console.error('Error sending email via Resend:', err);
    return res.status(500).json({ error: err.message });
  }
}
