import { supabase, formatPrice } from '/js/supabase-config.js';

let allOrders = [];
let currentFilter = 'all';

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function fetchOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    showToast('Failed to load orders', 'error');
    return;
  }

  allOrders = orders;
  renderOrders();
}

function renderOrders() {
  const tableBody = document.getElementById('ordersTable');
  tableBody.innerHTML = '';

  const filtered = currentFilter === 'all' 
    ? allOrders 
    : allOrders.filter(o => o.status === currentFilter);

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-secondary">No orders found.</td></tr>`;
    return;
  }

  filtered.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${order.order_number}</td>
      <td>${order.customer_name}</td>
      <td>${order.customer_phone}</td>
      <td>${order.city}</td>
      <td>${formatPrice(order.total)}</td>
      <td><span class="status-badge status-${order.status}">${order.status}</span></td>
      <td>${new Date(order.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-secondary view-order" data-id="${order.id}">View</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

document.getElementById('orderFilters').addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-btn')) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    renderOrders();
  }
});

// Modal Logic
const modalOverlay = document.getElementById('orderModal');
const closeModalBtn = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');

document.getElementById('ordersTable').addEventListener('click', (e) => {
  if (e.target.classList.contains('view-order')) {
    const id = e.target.getAttribute('data-id');
    const order = allOrders.find(o => o.id === id);
    if (order) openModal(order);
  }
});

closeModalBtn.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
  }
});

function openModal(order) {
  document.getElementById('modalOrderNumber').textContent = `Order #${order.order_number}`;
  
  let itemsHtml = order.order_items.map(item => `
    <div class="cart-summary-row" style="border-bottom: 1px solid var(--border); padding-bottom: 8px;">
      <div>
        <strong>${item.product_name}</strong><br>
        <span class="text-secondary">Size: ${item.size} | Qty: ${item.quantity}</span>
      </div>
      <div>${formatPrice(item.unit_price * item.quantity)}</div>
    </div>
  `).join('');

  modalContent.innerHTML = `
    <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <div>
        <h4 style="margin-bottom: 8px;">Customer</h4>
        <p class="text-secondary" style="font-size: 0.9rem;">
          ${order.customer_name}<br>
          ${order.customer_phone}<br>
          ${order.customer_email || 'N/A'}
        </p>
      </div>
      <div>
        <h4 style="margin-bottom: 8px;">Shipping Address</h4>
        <p class="text-secondary" style="font-size: 0.9rem;">
          ${order.shipping_address}<br>
          ${order.city}
        </p>
      </div>
    </div>
    
    ${order.notes ? `
    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 8px;">Notes</h4>
      <p class="text-secondary" style="font-size: 0.9rem;">${order.notes}</p>
    </div>` : ''}

    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">Order Items</h4>
      ${itemsHtml}
      <div class="cart-summary-row" style="margin-top: 12px;">
        <span>Subtotal</span>
        <span>${formatPrice(order.subtotal)}</span>
      </div>
      <div class="cart-summary-row">
        <span>Shipping</span>
        <span>${formatPrice(order.shipping_fee)}</span>
      </div>
      <div class="cart-summary-row total" style="margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px; font-weight: bold;">
        <span>Total</span>
        <span>${formatPrice(order.total)}</span>
      </div>
    </div>

    <div style="background: var(--surface-2); padding: 16px; border-radius: var(--radius);">
      <h4 style="margin-bottom: 12px;">Update Status</h4>
      <div class="flex" style="gap: 12px;">
        <select id="statusSelect" class="form-select" style="max-width: 200px;">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <button id="updateStatusBtn" class="btn btn-primary">Update</button>
      </div>
    </div>
  `;

  document.getElementById('updateStatusBtn').addEventListener('click', async () => {
    const newStatus = document.getElementById('statusSelect').value;
    const btn = document.getElementById('updateStatusBtn');
    btn.disabled = true;
    btn.textContent = '...';

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (error) {
      showToast('Failed to update status', 'error');
    } else {
      showToast('Status updated');
      order.status = newStatus;
      renderOrders();
      modalOverlay.classList.remove('active');
    }
    btn.disabled = false;
    btn.textContent = 'Update';
  });

  modalOverlay.classList.add('active');
}

fetchOrders();
