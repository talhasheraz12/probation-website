import { supabase, formatPrice } from './supabase-config.js';
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
  const shipping = 0; // Free shipping for now
  const total = subtotal + shipping;

  document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('checkoutShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
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
      // 1. Create order
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

      // 2. Create order items
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

      // 3. Cleanup & Redirect
      clearCart();
      window.location.href = `/order-confirmed.html?order=${order_id}`;

    } catch (error) {
      console.error('Checkout error:', error);
      showToast('There was an error placing your order. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
