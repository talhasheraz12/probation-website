import { supabase, formatPrice, SITE } from './supabase-config.js';
import { getCart, getCartTotal, clearCart } from './cart.js';
import { showToast } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  
  if (cart.length === 0) {
    window.location.href = '/shop.html';
    return;
  }

  // Render Order Summary
  const checkoutItems = document.getElementById('checkoutItems');
  checkoutItems.innerHTML = cart.map(item => `
    <div style="display: flex; gap: 12px; margin-bottom: 12px; align-items: center;">
      <div style="width: 50px; height: 60px; border-radius: 4px; overflow: hidden; background: var(--surface-2); flex-shrink: 0;">
        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="flex: 1; font-size: 0.85rem;">
        <div style="font-weight: 600;">${item.name}</div>
        <div style="color: var(--text-secondary);">Size: ${item.size} &times; ${item.quantity}</div>
      </div>
      <div style="font-weight: 600; font-size: 0.9rem;">
        ${formatPrice(item.price * item.quantity)}
      </div>
    </div>
  `).join('');

  const subtotal = getCartTotal();
  const shipping = SITE.shippingFee ?? 500;
  const total = subtotal + shipping;

  document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('checkoutShipping').textContent = formatPrice(shipping);
  document.getElementById('checkoutTotal').textContent = formatPrice(total);

  // Form Submit
  const checkoutForm = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('submitBtn');

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> PROCESSING...';

    const customer_name = document.getElementById('fullName').value.trim();
    const customer_phone = document.getElementById('phone').value.trim();
    const customer_email = document.getElementById('email').value.trim();
    const shipping_address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!customer_name || !customer_phone || !shipping_address || !city) {
      showToast('Please fill all required fields.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    try {
      // 1. Fetch latest product inventory & validate (No overselling)
      const { data: latestProducts, error: fetchErr } = await supabase
        .from('products')
        .select('*');

      if (fetchErr) throw fetchErr;

      const prodMap = new Map((latestProducts || []).map(p => [p.id, p]));
      const hoodieProduct = latestProducts?.find(p => p.category === 'hoodie' || (p.slug && p.slug.includes('hoodie')));
      const sweatpantProduct = latestProducts?.find(p => p.category === 'sweatpants' || p.category === 'joggers' || (p.slug && p.slug.includes('sweatpants')));

      // Pre-validate stock for every item
      for (const item of cart) {
        const isSetItem = item.isSet || (item.size && item.size.includes('Hoodie:'));
        if (isSetItem) {
          let hSize = item.hoodieSize;
          let pSize = item.sweatpantSize;
          if (!hSize || !pSize) {
            const hMatch = item.size.match(/Hoodie:\s*([A-Z0-9]+)/i);
            const pMatch = item.size.match(/Pants:\s*([A-Z0-9]+)|Sweatpants:\s*([A-Z0-9]+)/i);
            if (hMatch) hSize = hMatch[1].toUpperCase();
            if (pMatch) pSize = (pMatch[1] || pMatch[2]).toUpperCase();
          }

          const hStock = Number(hoodieProduct?.stock?.[hSize] ?? 0);
          const pStock = Number(sweatpantProduct?.stock?.[pSize] ?? 0);

          if (hStock < item.quantity) {
            showToast(`Sorry, only ${hStock} available for Hoodie size ${hSize}.`, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }
          if (pStock < item.quantity) {
            showToast(`Sorry, only ${pStock} available for Sweatpants size ${pSize}.`, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }
        } else {
          const prod = prodMap.get(item.productId);
          const curStock = Number(prod?.stock?.[item.size] ?? 0);
          if (curStock < item.quantity) {
            showToast(`Sorry, only ${curStock} left for ${item.name} (${item.size}).`, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }
        }
      }

      // 2. Create order in orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name,
          customer_email: customer_email || null,
          customer_phone,
          shipping_address,
          city,
          notes: notes || null,
          status: 'pending',
          subtotal,
          shipping_fee: shipping,
          total
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const order_id = orderData.id;

      // 3. Create order items
      const orderItems = cart.map(item => ({
        order_id,
        product_id: item.productId,
        product_name: item.name,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Safely decrement inventory and sync bundle stock
      const updatedStockMap = {};
      latestProducts.forEach(p => {
        updatedStockMap[p.id] = { ...(p.stock || {}) };
      });

      for (const item of cart) {
        const isSetItem = item.isSet || (item.size && item.size.includes('Hoodie:'));
        if (isSetItem) {
          let hSize = item.hoodieSize;
          let pSize = item.sweatpantSize;
          if (!hSize || !pSize) {
            const hMatch = item.size.match(/Hoodie:\s*([A-Z0-9]+)/i);
            const pMatch = item.size.match(/Pants:\s*([A-Z0-9]+)|Sweatpants:\s*([A-Z0-9]+)/i);
            if (hMatch) hSize = hMatch[1].toUpperCase();
            if (pMatch) pSize = (pMatch[1] || pMatch[2]).toUpperCase();
          }

          if (hoodieProduct && updatedStockMap[hoodieProduct.id]) {
            const curH = Number(updatedStockMap[hoodieProduct.id][hSize] || 0);
            updatedStockMap[hoodieProduct.id][hSize] = Math.max(0, curH - item.quantity);
          }
          if (sweatpantProduct && updatedStockMap[sweatpantProduct.id]) {
            const curP = Number(updatedStockMap[sweatpantProduct.id][pSize] || 0);
            updatedStockMap[sweatpantProduct.id][pSize] = Math.max(0, curP - item.quantity);
          }
        } else {
          if (updatedStockMap[item.productId]) {
            const cur = Number(updatedStockMap[item.productId][item.size] || 0);
            updatedStockMap[item.productId][item.size] = Math.max(0, cur - item.quantity);
          }
        }
      }

      // Re-sync Set product stock with minimum of hoodie and sweatpant stocks
      const setProducts = latestProducts.filter(p => p.category === 'set' || (p.slug && p.slug.includes('set')));
      setProducts.forEach(setProd => {
        if (hoodieProduct && sweatpantProduct && updatedStockMap[setProd.id]) {
          ['S', 'M', 'L', 'XL', 'XXL'].forEach(sz => {
            const h = Number(updatedStockMap[hoodieProduct.id]?.[sz] || 0);
            const p = Number(updatedStockMap[sweatpantProduct.id]?.[sz] || 0);
            updatedStockMap[setProd.id][sz] = Math.min(h, p);
          });
        }
      });

      // Persist all updated stocks to Supabase
      for (const prodId of Object.keys(updatedStockMap)) {
        try {
          await supabase.from('products').update({ stock: updatedStockMap[prodId] }).eq('id', prodId);
        } catch (stockErr) {
          console.warn('Stock update warning for', prodId, stockErr);
        }
      }

      // 5. Send order notification email via Resend (serverless)
      try {
        await fetch('/api/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            order: {
              id: order_id,
              order_number: orderData.order_number,
              customer_name,
              customer_phone,
              customer_email,
              shipping_address,
              city,
              notes,
              subtotal,
              shipping_fee: shipping,
              total
            },
            items: orderItems
          })
        }).catch(err => console.warn('Email notification error:', err));
      } catch (emailErr) {
        console.warn('Email trigger warning:', emailErr);
      }

      // 6. Cleanup & Redirect
      clearCart();
      window.location.href = `/order-confirmed.html?order=${order_id}`;

    } catch (error) {
      console.error('Checkout error:', error);
      showToast(error.message || 'There was an error placing your order. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
